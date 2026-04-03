import fitz  # PyMuPDF
from llama_index.core import VectorStoreIndex, Document
from llama_index.embeddings.huggingface import HuggingFaceEmbedding

PDF_PATH = "./public/merk_vet.pdf"

# Extraer texto de cada página
doc = fitz.open(PDF_PATH)
documents = []
for i, page in enumerate(doc):
    text = page.get_text()
    if text.strip():
        documents.append(Document(text=text, metadata={"page": i+1}))

print(f"Se extrajeron {len(documents)} fragmentos del PDF.")

# Usar embeddings locales de Hugging Face
embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")

# Crear y guardar el índice
index = VectorStoreIndex.from_documents(documents, embed_model=embed_model)
index.storage_context.persist(persist_dir="./storage")
print("Índice generado y guardado en ./storage (embeddings locales)")