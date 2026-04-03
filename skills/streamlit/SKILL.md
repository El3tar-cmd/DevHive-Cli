---
name: streamlit
description: Guidelines for developing interactive Streamlit web applications, covering configuration, UI, and workflow.
---

Always follow these guidelines when building a Streamlit web application:

This stack establishes a complete environment for developing interactive Streamlit web applications.
Streamlit enables rapid development and deployment of data-driven web applications with Python.

## Configuration

- Server configurations is already set in the `.streamlit/config.toml` file do not change it.
- Add custom theme configurations to the same file if needed but only if the user requests it.

## UI Guidelines

- Maintain default font settings (family, size, colors) unless specifically requested
- Focus on content organization and interactive elements
- Utilize Streamlit's built-in components for consistent UI
- IMPORTANT: Do not use any custom styling/CSS for the application unless explicitly requested. Use Streamlit's default styling and built-in components.

## Technical Considerations

- The `experimental_rerun` function is not supported in this environment instead use the `st.rerun()` function.
- Use standard Streamlit functions for application flow control

## Workflow

- Use the following workflow command to run the application:

  ```bash
  streamlit run app.py --server.port 5000
  ```
