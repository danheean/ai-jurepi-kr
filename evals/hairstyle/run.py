#!/usr/bin/env python3
"""
Hairstyle Recommendation Prompt Evaluation Harness

Evaluates production prompts against local Ollama models.
Stages: analyze (vision), recommend (text)
Output: metrics + report markdown
"""

import json
import base64
import subprocess
import sys
import re
from datetime import datetime
from pathlib import Path
from typing import Optional
from dataclasses import dataclass, asdict

import typer
from rich.console import Console
from rich.table import Table
from pydantic import ValidationError
from langchain_ollama import ChatOllama

from schemas import FaceAnalysis, ProviderRecommendation, Fixture

app = typer.Typer(help="Hairstyle recommendation prompt evaluation")
console = Console()

SCRIPT_DIR = Path(__file__).parent
REPO_ROOT = SCRIPT_DIR.parent.parent  # evals/hairstyle -> evals -> repo_root
PROMPTS_FILE = SCRIPT_DIR / "prompts.generated.json"
FIXTURES_FILE = SCRIPT_DIR / "fixtures.json"
REPORTS_DIR = SCRIPT_DIR / "reports"


@dataclass
class MetricsSummary:
    """Metrics for a single model × stage × locale."""
    model: str
    stage: str
    locale: str
    json_valid_rate: float
    schema_valid_rate: float
    gender_accuracy: Optional[float] = None
    face_shape_top1: Optional[float] = None
    face_shape_top1_confident: Optional[float] = None
    locale_compliance_rate: float = 1.0
    candidate_id_adherence: Optional[float] = None
    latency_p50_s: float = 0.0
    latency_p95_s: float = 0.0
    failures: list[str] = None

    def __post_init__(self):
        if self.failures is None:
            self.failures = []


def load_prompts() -> dict:
    """Load exported prompts and candidates."""
    if not PROMPTS_FILE.exists():
        console.print(
            f"[red]✗ Prompts file not found: {PROMPTS_FILE}[/red]"
        )
        console.print(
            "[yellow]Run: pnpm eval:export-prompts[/yellow]"
        )
        sys.exit(1)

    with open(PROMPTS_FILE) as f:
        return json.load(f)


def load_fixtures() -> list[Fixture]:
    """Load and parse test fixtures."""
    if not FIXTURES_FILE.exists():
        console.print(
            f"[red]✗ Fixtures file not found: {FIXTURES_FILE}[/red]"
        )
        sys.exit(1)

    with open(FIXTURES_FILE) as f:
        raw = json.load(f)

    return [Fixture(**item) for item in raw]


def get_available_models() -> list[str]:
    """Query Ollama for available models."""
    try:
        result = subprocess.run(
            ["ollama", "list"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode != 0:
            console.print(
                "[red]✗ ollama list failed[/red]"
            )
            return []

        lines = result.stdout.strip().split("\n")
        models = []
        for line in lines[1:]:  # Skip header
            parts = line.split()
            if parts:
                models.append(parts[0])
        return models
    except FileNotFoundError:
        console.print(
            "[red]✗ ollama not found in PATH[/red]"
        )
        return []
    except Exception as e:
        console.print(f"[red]✗ Error querying Ollama: {e}[/red]")
        return []


def is_vision_capable(model: str) -> bool:
    """Check if model supports vision via ollama show or name pattern."""
    try:
        result = subprocess.run(
            ["ollama", "show", model],
            capture_output=True,
            text=True,
            timeout=5
        )
        if "vision" in result.stdout.lower():
            return True
    except:
        pass

    # Fallback: name pattern
    vision_patterns = [
        "vl", "llava", "vision", "minicpm", "moondream", "gemma3"
    ]
    return any(pattern in model.lower() for pattern in vision_patterns)


def load_image_as_base64(image_path: Path) -> Optional[str]:
    """Load image and encode as base64."""
    if not image_path.exists():
        return None

    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def parse_json_lenient(text: str) -> Optional[dict]:
    """Parse JSON leniently: strip markdown fences, trailing commas."""
    # Remove markdown fences
    text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text, flags=re.MULTILINE)
    text = text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Try removing trailing commas (common AI mistake)
        text = re.sub(r",\s*([}\]])", r"\1", text)
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return None


def run_analyze_stage(
    model: str,
    prompts_data: dict,
    fixtures: list[Fixture],
    locales: list[str],
    limit: int = None
) -> list[MetricsSummary]:
    """Run analyze stage (vision-only models)."""
    import time

    if not is_vision_capable(model):
        return []

    console.print(f"[cyan]→ Analyze stage: {model}[/cyan]")

    llm = ChatOllama(model=model, temperature=0.1)

    summaries = []

    for locale in locales:
        prompt_text = next(
            (p["prompt"] for p in prompts_data["analyzePrompts"] if p["locale"] == locale),
            None
        )
        if not prompt_text:
            continue

        test_fixtures = fixtures[:limit] if limit else fixtures

        json_valid = 0
        schema_valid = 0
        gender_correct = 0
        face_shape_correct = 0
        face_shape_correct_confident = 0
        latencies = []
        failures = []

        for fixture in test_fixtures:
            # Resolve path: fixture.imagePath is relative to SCRIPT_DIR (evals/hairstyle)
            image_path = (SCRIPT_DIR / fixture.imagePath).resolve()
            b64 = load_image_as_base64(image_path)

            if not b64:
                failures.append(f"Image load failed: {fixture.name}")
                continue

            # Determine MIME type
            suffix = image_path.suffix.lower()
            mime_map = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".png": "image/png"}
            mime_type = mime_map.get(suffix, "image/jpeg")

            try:
                start = time.time()
                from langchain_core.messages import HumanMessage
                message = HumanMessage(
                    content=[
                        {"type": "text", "text": prompt_text},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:{mime_type};base64,{b64}"},
                        },
                    ]
                )
                response = llm.invoke([message])
                latency = time.time() - start
                latencies.append(latency)

                # Try to parse response
                content = response.content
                parsed = parse_json_lenient(content)

                if parsed:
                    json_valid += 1

                    # Validate schema
                    try:
                        analysis = FaceAnalysis(**parsed)
                        schema_valid += 1

                        # Gender accuracy
                        if analysis.gender == fixture.gender:
                            gender_correct += 1

                        # Face shape accuracy
                        if analysis.faceShape == fixture.faceShape:
                            face_shape_correct += 1
                            if fixture.faceShapeConfident:
                                face_shape_correct_confident += 1
                    except ValidationError as e:
                        failures.append(f"{fixture.name}: schema error: {str(e)[:100]}")
                else:
                    failures.append(f"{fixture.name}: JSON parse failed")

            except Exception as e:
                failures.append(f"{fixture.name}: {type(e).__name__}: {str(e)[:80]}")

        n_fixtures = len(test_fixtures)
        if n_fixtures == 0:
            continue

        latencies.sort()
        p50 = latencies[len(latencies) // 2] if latencies else 0
        p95 = latencies[int(len(latencies) * 0.95)] if len(latencies) > 0 else 0

        n_confident = sum(1 for f in test_fixtures if f.faceShapeConfident)

        summary = MetricsSummary(
            model=model,
            stage="analyze",
            locale=locale,
            json_valid_rate=json_valid / n_fixtures,
            schema_valid_rate=schema_valid / n_fixtures,
            gender_accuracy=gender_correct / n_fixtures if n_fixtures > 0 else 0,
            face_shape_top1=face_shape_correct / n_fixtures if n_fixtures > 0 else 0,
            face_shape_top1_confident=face_shape_correct_confident / n_confident if n_confident > 0 else 0,
            latency_p50_s=p50,
            latency_p95_s=p95,
            failures=failures[:3]  # Keep first 3
        )
        summaries.append(summary)

    return summaries


def run_recommend_stage(
    model: str,
    prompts_data: dict,
    locales: list[str],
    limit: int = None
) -> list[MetricsSummary]:
    """Run recommend stage (text models)."""
    import time

    console.print(f"[cyan]→ Recommend stage: {model}[/cyan]")

    llm = ChatOllama(model=model, temperature=0.1)

    summaries = []

    for locale in locales:
        rec_prompts = [
            p for p in prompts_data["recommendPrompts"]
            if p["locale"] == locale
        ]

        if not rec_prompts:
            continue

        test_prompts = rec_prompts[:limit] if limit else rec_prompts

        json_valid = 0
        schema_valid = 0
        candidate_adherence = 0
        hangul_count = 0
        latencies = []
        failures = []

        for prompt_data in test_prompts:
            prompt_text = prompt_data["prompt"]
            candidate_ids = {c["id"] for c in prompt_data["candidates"]}

            try:
                start = time.time()
                response = llm.invoke(prompt_text)
                latency = time.time() - start
                latencies.append(latency)

                content = response.content
                parsed = parse_json_lenient(content)

                if parsed:
                    json_valid += 1

                    # Coerce to array
                    items = parsed if isinstance(parsed, list) else (
                        parsed.get("recommendations", [parsed]) if isinstance(parsed, dict) else [parsed]
                    )

                    valid_recs = 0
                    all_valid_ids = True

                    for item in items:
                        if isinstance(item, dict):
                            try:
                                rec = ProviderRecommendation(**item)
                                valid_recs += 1

                                if rec.hairstyleId not in candidate_ids:
                                    all_valid_ids = False
                            except ValidationError:
                                pass

                    if valid_recs > 0:
                        schema_valid += 1
                        if all_valid_ids:
                            candidate_adherence += 1

                    # Check for Hangul (locale compliance for Korean)
                    if locale == "ko":
                        if any("가" <= c <= "힯" for c in content):
                            hangul_count += 1
                else:
                    failures.append("JSON parse failed")

            except Exception as e:
                failures.append(f"{type(e).__name__}: {str(e)[:80]}")

        n_prompts = len(test_prompts)
        if n_prompts == 0:
            continue

        latencies.sort()
        p50 = latencies[len(latencies) // 2] if latencies else 0
        p95 = latencies[int(len(latencies) * 0.95)] if len(latencies) > 0 else 0

        summary = MetricsSummary(
            model=model,
            stage="recommend",
            locale=locale,
            json_valid_rate=json_valid / n_prompts,
            schema_valid_rate=schema_valid / n_prompts,
            candidate_id_adherence=candidate_adherence / max(schema_valid, 1),
            locale_compliance_rate=hangul_count / n_prompts if locale == "ko" else 1.0,
            latency_p50_s=p50,
            latency_p95_s=p95,
            failures=failures[:3]
        )
        summaries.append(summary)

    return summaries


@app.command()
def eval(
    stage: str = typer.Option("all", help="Stage: analyze|recommend|all"),
    models: str = typer.Option("all", help="Models: all or comma-separated list"),
    locale: str = typer.Option("both", help="Locale: ko|en|both"),
    limit: Optional[int] = typer.Option(None, help="Limit fixtures/prompts per model")
):
    """Run evaluation harness."""

    REPORTS_DIR.mkdir(exist_ok=True)

    console.print("[bold]Hairstyle Recommendation Eval Harness[/bold]")

    # Load data
    prompts_data = load_prompts()
    fixtures = load_fixtures()

    console.print(f"[dim]Prompts: {len(prompts_data['analyzePrompts'])} analyze, "
                  f"{len(prompts_data['recommendPrompts'])} recommend[/dim]")
    console.print(f"[dim]Fixtures: {len(fixtures)}[/dim]")

    # Discover models
    available = get_available_models()
    console.print(f"[dim]Available models: {', '.join(available) or '(none)'}[/dim]")

    if not available:
        console.print("[red]✗ No models available. Start Ollama and pull models.[/red]")
        sys.exit(1)

    model_list = (
        available if models == "all" else [m.strip() for m in models.split(",")]
    )
    model_list = [m for m in model_list if m in available]

    if not model_list:
        console.print("[red]✗ No models matched.[/red]")
        sys.exit(1)

    locale_list = ["ko", "en"] if locale == "both" else [locale]

    # Run evaluation
    all_summaries = []

    for model in model_list:
        if stage in ["analyze", "all"]:
            all_summaries.extend(
                run_analyze_stage(model, prompts_data, fixtures, locale_list, limit)
            )

        if stage in ["recommend", "all"]:
            all_summaries.extend(
                run_recommend_stage(model, prompts_data, locale_list, limit)
            )

    # Generate report
    report_file = REPORTS_DIR / f"report-{datetime.now().strftime('%Y%m%d-%H%M%S')}.md"

    with open(report_file, "w") as f:
        f.write("# Hairstyle Recommendation Evaluation Report\n\n")
        f.write(f"**Generated:** {datetime.now().isoformat()}\n\n")

        # Summary table
        table = Table(title="Evaluation Summary")
        table.add_column("Model", style="cyan")
        table.add_column("Stage", style="magenta")
        table.add_column("Locale")
        table.add_column("JSON Valid %")
        table.add_column("Schema Valid %")
        table.add_column("Accuracy %")
        table.add_column("P50 (s)", style="green")
        table.add_column("P95 (s)", style="green")

        for summary in all_summaries:
            acc_key = (
                "gender_accuracy" if summary.stage == "analyze"
                else "candidate_id_adherence"
            )
            acc_val = getattr(summary, acc_key)
            acc_pct = f"{acc_val * 100:.0f}%" if acc_val is not None else "—"

            table.add_row(
                summary.model,
                summary.stage,
                summary.locale,
                f"{summary.json_valid_rate * 100:.0f}%",
                f"{summary.schema_valid_rate * 100:.0f}%",
                acc_pct,
                f"{summary.latency_p50_s:.2f}",
                f"{summary.latency_p95_s:.2f}",
            )

            # Write to report file
            f.write(f"## {summary.model} - {summary.stage} ({summary.locale})\n\n")
            f.write(f"- **JSON Valid Rate:** {summary.json_valid_rate * 100:.1f}%\n")
            f.write(f"- **Schema Valid Rate:** {summary.schema_valid_rate * 100:.1f}%\n")
            if summary.gender_accuracy is not None:
                f.write(f"- **Gender Accuracy:** {summary.gender_accuracy * 100:.1f}%\n")
            if summary.face_shape_top1 is not None:
                f.write(f"- **Face Shape Top-1:** {summary.face_shape_top1 * 100:.1f}%\n")
            if summary.face_shape_top1_confident is not None and summary.face_shape_top1_confident < 1:
                f.write(f"- **Face Shape Top-1 (Confident Only):** {summary.face_shape_top1_confident * 100:.1f}%\n")
            if summary.candidate_id_adherence is not None:
                f.write(f"- **Candidate ID Adherence:** {summary.candidate_id_adherence * 100:.1f}%\n")
            f.write(f"- **Latency P50:** {summary.latency_p50_s:.2f}s\n")
            f.write(f"- **Latency P95:** {summary.latency_p95_s:.2f}s\n")
            if summary.failures:
                f.write(f"- **Failures:** {summary.failures[0]}\n")
            f.write("\n")

        f.write(f"\n**Report saved to:** {report_file}\n")

    # Print table
    console.print()
    console.print(table)
    console.print(f"\n[green]✓ Report saved to {report_file}[/green]")


if __name__ == "__main__":
    app()
