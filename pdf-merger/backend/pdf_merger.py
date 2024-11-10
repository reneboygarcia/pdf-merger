from PyPDF2 import PdfMerger
import os

def merge_pdfs(input_paths, output_path):
    """
    Merge multiple PDF files into a single PDF file.
    
    Args:
        input_paths (list): List of paths to input PDF files
        output_path (str): Path where the merged PDF will be saved
    """
    try:
        # Create a PdfMerger object
        merger = PdfMerger()
        
        # Add each PDF to the merger
        for pdf_path in input_paths:
            if not os.path.exists(pdf_path):
                raise FileNotFoundError(f"PDF file not found: {pdf_path}")
            merger.append(pdf_path)
        
        # Write the merged PDF to the output file
        with open(output_path, 'wb') as output_file:
            merger.write(output_file)
        
        # Close the merger
        merger.close()
        
        # Verify the output file exists
        if not os.path.exists(output_path):
            raise Exception("Failed to create merged PDF")
            
        return True
        
    except Exception as e:
        print(f"Error in merge_pdfs: {str(e)}")
        raise e