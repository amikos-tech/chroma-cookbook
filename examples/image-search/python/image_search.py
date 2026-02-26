"""Chroma image search example with OpenCLIP.

This example runs fully local using `PersistentClient` and demonstrates:
1) Indexing image URIs with OpenCLIP embeddings.
2) Text-to-image retrieval (`query_texts`).
3) Image-to-image retrieval (`query_uris`).

Run:
    pip install -r examples/image-search/python/requirements.txt
    python examples/image-search/python/image_search.py
"""

from __future__ import annotations

import shutil
from pathlib import Path
from typing import Any

import chromadb
from chromadb.utils.data_loaders import ImageLoader
from chromadb.utils.embedding_functions import OpenCLIPEmbeddingFunction

BASE_DIR = Path("chroma_data/image_search_example")
IMAGE_DIR = Path(__file__).resolve().parent / "images"
COLLECTION_NAME = "image_search_demo_python"


def _print_results(label: str, results: dict[str, Any]) -> None:
    ids = results.get("ids", [[]])[0]
    uris = results.get("uris", [[]])[0] if results.get("uris") else []
    distances = results.get("distances", [[]])[0] if results.get("distances") else []
    metadatas = results.get("metadatas", [[]])[0] if results.get("metadatas") else []

    print(f"\\n{label}")
    for idx, doc_id in enumerate(ids):
        uri = uris[idx] if idx < len(uris) else None
        distance = distances[idx] if idx < len(distances) else None
        metadata = metadatas[idx] if idx < len(metadatas) else None
        print(
            f"  rank={idx + 1} id={doc_id} distance={distance} "
            f"uri={Path(uri).name if uri else None} metadata={metadata}"
        )


def main() -> None:
    if BASE_DIR.exists():
        shutil.rmtree(BASE_DIR)

    embedding_function = OpenCLIPEmbeddingFunction()
    image_loader = ImageLoader()

    client = chromadb.PersistentClient(path=str(BASE_DIR))
    collection = client.create_collection(
        name=COLLECTION_NAME,
        embedding_function=embedding_function,
        data_loader=image_loader,
    )

    images = {
        "cat": IMAGE_DIR / "cat.png",
        "dog": IMAGE_DIR / "dog.jpg",
        "dog-with-person": IMAGE_DIR / "dog-with-person.jpg",
    }

    for image_path in images.values():
        if not image_path.exists():
            raise FileNotFoundError(f"missing example image: {image_path}")

    collection.add(
        ids=list(images.keys()),
        uris=[str(path) for path in images.values()],
        metadatas=[
            {"label": "cat"},
            {"label": "dog"},
            {"label": "dog-with-person"},
        ],
    )

    dog_text_results = collection.query(
        query_texts=["a photo of a dog"],
        n_results=3,
        include=["uris", "metadatas", "distances"],
    )
    _print_results("text->image: 'a photo of a dog'", dog_text_results)

    cat_text_results = collection.query(
        query_texts=["a photo of a cat"],
        n_results=3,
        include=["uris", "metadatas", "distances"],
    )
    _print_results("text->image: 'a photo of a cat'", cat_text_results)

    image_to_image_results = collection.query(
        query_uris=[str(images["dog-with-person"])],
        n_results=3,
        include=["uris", "metadatas", "distances"],
    )
    _print_results("image->image: query dog-with-person.jpg", image_to_image_results)

    if image_to_image_results.get("ids", [[]])[0][0] != "dog-with-person":
        raise AssertionError("expected query image to match itself as top result")

    print("\\npython: image search example passed")


if __name__ == "__main__":
    main()
