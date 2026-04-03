from fastapi import FastAPI, Query
from llama_index.core import StorageContext, load_index_from_storage
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.core.query_engine import RetrieverQueryEngine
import uvicorn

app = FastAPI()

# Cargar el índice generado previamente
PERSIST_DIR = "./storage"
embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")
storage_context = StorageContext.from_defaults(persist_dir=PERSIST_DIR)
index = load_index_from_storage(storage_context, embed_model=embed_model)
query_engine = index.as_query_engine(llm=None)

@app.get("/query")
def query(q: str = Query(..., description="Consulta para el RAG")):
    response = query_engine.query(q)
    # response.response contiene el texto generado
    # response.source_nodes contiene los fragmentos fuente
    return {
        "answer": str(response),
        "sources": [
            {"page": n.metadata.get("page"), "text": n.text}
            for n in response.source_nodes
        ]
    }

if __name__ == "__main__":
    uvicorn.run("rag_api:app", host="0.0.0.0", port=8000, reload=True)
