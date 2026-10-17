#!/usr/bin/env python3
"""
long 형식 CSV(관리자 → CSV(long))를 읽어 기본 분석을 돌린다.

사용법:
  pip install -r analysis/requirements.txt
  python analysis/analyze.py export_long.csv [more.csv ...] [--all] [--out report.md]
  여러 CSV(예: 일본 실험 + 미국 실험)를 함께 넣으면 experiment_locale 을 국가 요인으로 써서
  국가 × 조건의 이원분산분석도 함께 출력한다.

출력:
  - 조건별 참가자 수, 주의 점검 통과율
  - 구성개념별 신뢰도(Cronbach's alpha)
  - 구성개념별 조건 평균/SD 와 일원분산분석(F, p, eta^2)
  - 광고별(post_ad) 분해 결과
  - 광고 버튼(CTA) 클릭률
  - (CSV 2개 이상) 국가 × 조건 이원분산분석
  - 조작 점검 문항의 조건별 분포
결과는 마크다운으로 출력하며 --out 으로 파일에 저장할 수 있다.
논문용 본 분석(혼합 분산분석, 매개 분석)은 R/SPSS/PROCESS 로 하되, 이 스크립트가 데이터 정합성 확인과 초안 표 작성을 맡는다.
"""
import argparse
import re
import sys

import pandas as pd
from scipy import stats

try:
    import statsmodels.api as sm
    import statsmodels.formula.api as smf
except ImportError:  # statsmodels 없으면 이원분산분석만 생략
    sm = None
    smf = None


def cronbach_alpha(wide: pd.DataFrame) -> float:
    """wide: 행=응답 단위, 열=문항. 결측 행 제거."""
    w = wide.dropna()
    k = w.shape[1]
    if k < 2 or len(w) < 3:
        return float("nan")
    item_var = w.var(axis=0, ddof=1).sum()
    total_var = w.sum(axis=1).var(ddof=1)
    if total_var == 0:
        return float("nan")
    return k / (k - 1) * (1 - item_var / total_var)


def attention_expected(row) -> str | None:
    m = re.search(r"[「\"'“]\s*(\d+)\s*[」\"'”]", str(row))
    return m.group(1) if m else None


def anova_table(scores: pd.DataFrame, label: str) -> list[str]:
    """scores: columns condition_code, score"""
    lines = []
    g = scores.groupby("condition_code")["score"]
    desc = g.agg(["count", "mean", "std"]).rename(columns={"count": "n", "mean": "M", "std": "SD"})
    lines.append(f"**{label}**\n")
    lines.append(desc.round(2).to_markdown())
    groups = [v.values for _, v in g if len(v) > 1]
    if len(groups) >= 2:
        f, p = stats.f_oneway(*groups)
        grand = scores["score"].mean()
        ss_between = sum(len(v) * (v.mean() - grand) ** 2 for v in groups)
        ss_total = ((scores["score"] - grand) ** 2).sum()
        eta2 = ss_between / ss_total if ss_total else float("nan")
        lines.append(f"\n일원분산분석: F({len(groups)-1}, {len(scores)-len(groups)}) = {f:.2f}, p = {p:.4f}, η² = {eta2:.3f}\n")
    else:
        lines.append("\n(집단이 2개 미만이라 분산분석 생략)\n")
    return lines


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("csv", nargs="+")
    ap.add_argument("--all", action="store_true", help="미완료 참가자도 포함")
    ap.add_argument("--out", help="마크다운 저장 경로")
    args = ap.parse_args()

    df = pd.concat([pd.read_csv(c, encoding="utf-8-sig") for c in args.csv], ignore_index=True)
    if "experiment_locale" not in df.columns:
        df["experiment_locale"] = "na"
    if not args.all:
        df = df[df["status"] == "completed"]
    multi = df["experiment_locale"].nunique() > 1
    out: list[str] = []
    out.append(f"# 분석 보고서\n\n원본: `{', '.join(args.csv)}` · 분석 대상 참가자 {df['participant_id'].nunique()}명\n")

    # 참가자 수
    n_by = df.drop_duplicates("participant_id").groupby("condition_code")["participant_id"].count()
    out.append("## 조건별 참가자 수\n")
    keys = ["experiment_locale", "condition_code"] if multi else ["condition_code"]
    n_by = df.drop_duplicates("participant_id").groupby(keys)["participant_id"].count()
    out.append(n_by.rename("n").to_markdown())
    out.append("")

    # CTA 클릭률 (노출 단위)
    if "cta_clicked" in df.columns:
        ex = df[df["phase"] == "post_ad"].drop_duplicates(["participant_id", "exposure_order"])
        ex = ex[pd.to_numeric(ex["cta_clicked"], errors="coerce").notna()]
        if len(ex):
            rate = ex.groupby(keys)["cta_clicked"].apply(lambda s: pd.to_numeric(s).mean() * 100).round(1)
            out.append("## 광고ボタン(CTA) 클릭률 (%)\n".replace("ボタン", " 버튼"))
            out.append(rate.rename("cta_%").to_markdown())
            out.append("")

    # 주의 점검
    att = df[df["construct"] == "attention_check"].copy()
    if len(att):
        # 정답은 long CSV 에 없으므로 문항 코드별로 2 를 기본 정답으로 두고, 필요하면 여기서 수정
        att["passed"] = att["value"].astype(str).str.strip() == "2"
        rate = att.groupby("condition_code")["passed"].mean().mul(100).round(1)
        out.append("## 주의 점검 통과율 (%)\n")
        out.append(rate.rename("pass_%").to_markdown())
        out.append("")

    # 리커트 구성개념
    lik = df[(df["item_type"] == "likert") & (df["construct"] != "attention_check")].copy()
    lik["value"] = pd.to_numeric(lik["value"], errors="coerce")
    lik["unit"] = lik.apply(
        lambda r: f"{r['participant_id']}|{r['exposure_order']}" if r["phase"] == "post_ad" else r["participant_id"], axis=1
    )
    out.append("## 구성개념별 신뢰도와 조건 비교\n")
    for (phase, construct), sub in lik.groupby(["phase", "construct"]):
        wide = sub.pivot_table(index="unit", columns="item_code", values="value", aggfunc="first")
        alpha = cronbach_alpha(wide)
        out.append(f"### {construct} ({phase}) — 문항 {wide.shape[1]}개, Cronbach α = {alpha:.3f}\n")
        scores = sub.groupby("unit").agg(
            score=("value", "mean"), condition_code=("condition_code", "first"), locale=("experiment_locale", "first")
        ).reset_index()
        out.extend(anova_table(scores, "전체"))
        if multi and smf is not None:
            model = smf.ols("score ~ C(locale) * C(condition_code)", data=scores).fit()
            tbl = sm.stats.anova_lm(model, typ=2).round(3)
            out.append("**국가(locale) × 조건 이원분산분석 (Type II)**\n")
            out.append(tbl.to_markdown())
            cell = scores.groupby(["locale", "condition_code"])["score"].agg(["count", "mean", "std"]).round(2)
            out.append("\n셀 평균:\n")
            out.append(cell.to_markdown())
            out.append("")
        elif multi:
            out.append("(statsmodels 가 없어 이원분산분석 생략: pip install statsmodels)\n")
        if phase == "post_ad":
            for ad_code, s2 in sub.groupby("ad_code"):
                sc = s2.groupby("unit").agg(score=("value", "mean"), condition_code=("condition_code", "first")).reset_index()
                out.extend(anova_table(sc, f"광고 {ad_code}"))
        out.append("")

    # 선택형 분포
    single = df[(df["item_type"].isin(["single", "multi"])) & (df["phase"] != "pre")]
    if len(single):
        out.append("## 선택형 문항의 조건별 분포 (%)\n")
        for code, sub in single.groupby("item_code"):
            ct = pd.crosstab(sub["condition_code"], sub["value"], normalize="index").mul(100).round(1)
            out.append(f"**{code}**\n")
            out.append(ct.to_markdown())
            out.append("")

    text = "\n".join(out)
    if args.out:
        with open(args.out, "w", encoding="utf-8") as f:
            f.write(text)
        print(f"saved: {args.out}")
    else:
        print(text)


if __name__ == "__main__":
    sys.exit(main())
