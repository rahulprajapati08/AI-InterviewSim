import fitz  # PyMuPDF
import json
import re
from langchain_ollama import OllamaLLM
from langchain_core.prompts import PromptTemplate
from llm_groq_config import llm


# Step 1: Extract text from PDF
def extract_text_from_pdf(file_path):
    """
    Extract text from PDF using PyMuPDF
    """
    text = ""
    try:
        with fitz.open(file_path) as pdf:
            for page in pdf:
                text += page.get_text()
        return text.strip()
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        return ""


# Step 2: Clean and validate JSON response
def clean_json_response(response):
    """
    Clean the LLM response to extract valid JSON
    """
    # Remove any markdown code blocks
    response = re.sub(r'```json\s*', '', response)
    response = re.sub(r'```\s*', '', response)
    
    # Find JSON-like content
    json_match = re.search(r'\{.*\}', response, re.DOTALL)
    if json_match:
        return json_match.group(0)
    
    return response.strip()


# Step 3: Define the LangChain LLM + Prompt
def setup_llm_chain():
    """
    Setup LLM and prompt chain
    """
    try:
        #llm = OllamaLLM(model="mistral")  # Updated model name
        
        template = """
You are an intelligent resume parser. Extract information from the resume text and return ONLY valid JSON in this exact format:

{{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "phone number",
  "education": [
    {{
      "degree": "degree name",
      "institution": "school name",
      "year": "graduation year"
    }}
  ],
  "skills": ["skill1", "skill2", "skill3"],
  "experience": [
    {{
      "title": "job title",
      "company": "company name",
      "duration": "time period",
      "description": "job description"
    }}
  ],
  "projects": [
    {{
      "title": "project name",
      "tech": ["technology1", "technology2"],
      "description": "project description"
    }}
  ]
}}

Important: Return ONLY the JSON object, no additional text or explanation.

Resume Text:
{text}
"""

        prompt = PromptTemplate(
            input_variables=["text"],
            template=template
        )

        chain = prompt | llm
        return chain
    
    except Exception as e:
        print(f"Error setting up LLM chain: {e}")
        return None





# Step 4: Parse resume with error handling
def parse_resume_with_llm(pdf_path, max_retries=3):
    """
    Parse resume with retry logic and error handling
    """
    # Extract text from PDF
    resume_text = extract_text_from_pdf(pdf_path)
    if not resume_text:
        return {"error": "Could not extract text from PDF"}
    
    # Setup LLM chain
    chain = setup_llm_chain()
    if not chain:
        return {"error": "Could not setup LLM chain"}
    
    # Try parsing with retries
    for attempt in range(max_retries):
        try:
            
            
            # Get response from LLM
            response = chain.invoke({"text":resume_text[:4000]})  # Limit text length
            
            # Clean and parse JSON
            cleaned_response = clean_json_response(response)
            parsed_data = json.loads(cleaned_response)
            
            
            return parsed_data
            
        except json.JSONDecodeError as e:
            print(f"❌ JSON parsing error on attempt {attempt + 1}: {e}")
            if attempt == max_retries - 1:
                return {
                    "error": "Failed to parse JSON after multiple attempts",
                    "raw_response": response,
                    "cleaned_response": cleaned_response
                }
        
        except Exception as e:
            print(f"❌ General error on attempt {attempt + 1}: {e}")
            if attempt == max_retries - 1:
                return {"error": f"Failed to process resume: {str(e)}"}
    
    return {"error": "Unexpected failure"}


# Step 5: Main execution with better error handling
def main():
    """
    Main function to run the resume parser
    """
    pdf_path = "test-files/Rahul_Resume_provisional_.pdf"  # Replace with your file path
    
    print("🔄 Starting resume parsing...")
    print(f"📄 Processing file: {pdf_path}")
    
    # Check if file exists
    try:
        with open(pdf_path, 'rb') as f:
            pass  # Just check if file can be opened
    except FileNotFoundError:
        print(f"❌ Error: File not found at {pdf_path}")
        print("Please check the file path and try again.")
        return
    except Exception as e:
        print(f"❌ Error accessing file: {e}")
        return
    
    # Parse the resume
    result = parse_resume_with_llm(pdf_path)
    
    # Display results
    print("\n" + "="*50)
    print("📝 PARSED RESUME OUTPUT")
    print("="*50)
    
    if "error" in result:
        print(f"❌ Error: {result['error']}")
        if "raw_response" in result:
            print(f"\n🔍 Raw LLM Response:\n{result['raw_response']}")
    else:
        # Pretty print the JSON
        print(json.dumps(result, indent=2, ensure_ascii=False))
        
        # Save to file
        try:
            output_file = pdf_path.replace('.pdf', '_parsed.json')
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(result, f, indent=2, ensure_ascii=False)
            print(f"\n💾 Results saved to: {output_file}")
        except Exception as e:
            print(f"❌ Could not save results to file: {e}")


if __name__ == "__main__":
    main()