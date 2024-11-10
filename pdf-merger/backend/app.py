from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import os
import secrets
from werkzeug.utils import secure_filename
from pdf_merger import merge_pdfs

app = Flask(__name__)
CORS(
    app,
    resources={
        r"/api/*": {
            "origins": "*",
            "methods": ["GET", "POST", "OPTIONS"],
            "allow_headers": ["Content-Type", "Accept", "Origin"],
            "expose_headers": ["Content-Type", "Content-Disposition"],
            "supports_credentials": False
        }
    }
)

# Configure upload folder
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

@app.route("/api/merge-pdfs", methods=["POST"])
def merge_pdf_files():
    if 'pdfs' not in request.files:
        return jsonify({"error": "No PDF files provided"}), 400
    
    files = request.files.getlist('pdfs')
    if len(files) < 2:
        return jsonify({"error": "At least 2 PDF files are required"}), 400

    temp_paths = []
    try:
        # Save uploaded files temporarily
        for file in files:
            if file.filename:
                filename = secure_filename(file.filename)
                filepath = os.path.join(UPLOAD_FOLDER, filename)
                file.save(filepath)
                temp_paths.append(filepath)

        # Merge PDFs
        output_path = os.path.join(UPLOAD_FOLDER, "merged_output.pdf")
        merge_pdfs(temp_paths, output_path)
        
        # Send the file
        response = send_file(
            output_path,
            mimetype='application/pdf',
            as_attachment=True,
            download_name='merged.pdf'
        )
        
        # Clean up temporary files after sending the response
        @response.call_on_close
        def cleanup():
            for path in temp_paths:
                try:
                    if os.path.exists(path):
                        os.remove(path)
                except Exception as e:
                    print(f"Error cleaning up {path}: {e}")
            try:
                if os.path.exists(output_path):
                    os.remove(output_path)
            except Exception as e:
                print(f"Error cleaning up merged file: {e}")
                
        return response

    except Exception as e:
        # Clean up on error
        for path in temp_paths:
            try:
                if os.path.exists(path):
                    os.remove(path)
            except:
                pass
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
