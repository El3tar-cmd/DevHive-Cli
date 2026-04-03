---
name: python
description: Python development best practices, project setup, and common patterns
tags: [python, development, best-practices]
---

## Python Project Setup

### Virtual Environment
```bash
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
.venv\Scripts\activate     # Windows
pip install -r requirements.txt
```

### Project Structure
```
my-project/
├── src/my_package/
│   ├── __init__.py
│   ├── main.py
│   └── utils.py
├── tests/
│   ├── __init__.py
│   └── test_main.py
├── pyproject.toml
├── requirements.txt
└── README.md
```

### pyproject.toml
```toml
[project]
name = "my-package"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = []

[project.optional-dependencies]
dev = ["pytest", "ruff", "mypy"]

[tool.ruff]
line-length = 100
```

### Common Patterns
```python
# Dataclasses (prefer over plain classes for data)
from dataclasses import dataclass, field

@dataclass
class User:
    name: str
    email: str
    tags: list[str] = field(default_factory=list)

# Context managers
with open("file.txt") as f:
    content = f.read()

# Type hints (always use)
def process(items: list[str]) -> dict[str, int]:
    return {item: len(item) for item in items}

# Error handling
try:
    result = risky_operation()
except SpecificError as e:
    logger.error(f"Operation failed: {e}")
    raise

# Pathlib (prefer over os.path)
from pathlib import Path
config = Path("config.json").read_text()
```

### Testing with pytest
```python
import pytest

def test_process():
    result = process(["hello", "world"])
    assert result == {"hello": 5, "world": 5}

def test_raises():
    with pytest.raises(ValueError):
        process_invalid(None)
```

### Running
```bash
pytest                    # run all tests
pytest -v                 # verbose
pytest --cov=src          # with coverage
ruff check .              # linting
mypy src/                 # type checking
```
