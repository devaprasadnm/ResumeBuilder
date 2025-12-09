# Job Description Analysis & Resume Matching Plan

## Overview
We will add a feature to allow users to upload a Job Description (JD) (Text or PDF). The application will use Google's Gemini 2.5 Flash model to analyze the JD and suggest:
1.  **Tailored Professional Summary**: A summary that highlights relevant experience for the specific role.
2.  **Key Skills**: Skills extracted from the JD that the user should consider adding.
3.  **Required Experience**: The years of experience mentioned in the JD.

These suggestions will be presented in a "Suggestions" panel, allowing the user to selectively apply them to their resume without overriding their existing data.

## Implementation Steps

### 1. Backend (`app.py`)
-   **Dependencies**: Add `google-generativeai` to `requirements.txt`.
-   **Configuration**: Setup Gemini API client using the API key (from Environment Variables).
-   **New Route `/analyze-jd`**:
    -   Accept `POST` request.
    -   Input: `jd_text` (string) or `jd_file` (file).
    -   Logic:
        -   If file is PDF, extract text using `PyPDF2`.
        -   Construct a prompt for Gemini:
            > "Analyze the following Job Description. Extract the required 'Years of Experience', a list of 'Key Skills', and write a 'Professional Summary' tailored to this role. Return the result as a JSON object with keys: 'summary', 'skills', 'experience'."
        -   Call Gemini API.
        -   Return the JSON response.

### 2. Frontend (`templates/index.html`)
-   Add a new section **"Job Description Matcher"** (e.g., in the sidebar or a new tab/section).
-   **UI Elements**:
    -   Text Area: "Paste Job Description here..."
    -   File Input: "Or upload JD PDF"
    -   Button: "Analyze JD"
    -   **Results Panel** (Hidden by default):
        -   **Suggested Summary**: With a "Use This" button.
        -   **Key Skills**: List of skills with "Add" buttons (or "Add All").
        -   **Experience**: Display text.

### 3. Frontend Logic (`static/js/script.js`)
-   **`handleJDAnalysis()`**:
    -   Gather text or file.
    -   Send to `/analyze-jd`.
    -   Show loading state.
-   **`displayJDSuggestions(data)`**:
    -   Render the returned JSON data into the Results Panel.
-   **`applySummary(summary)`**:
    -   Update the "Professional Summary" field in the main form.
-   **`addSkill(skill)`**:
    -   Append the skill to the "Skills" section (checking for duplicates).

## API Key Configuration
-   The user needs to provide the `GEMINI_API_KEY`.
-   We will add this to the `.env` file.

## Next Steps
1.  Install `google-generativeai`.
2.  Implement the backend route.
3.  Update the UI.
4.  Test with a sample JD.
