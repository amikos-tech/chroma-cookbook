"""Chroma image search example with OpenCLIP.

This example runs fully local using `PersistentClient` and demonstrates:
1) Indexing image URIs with OpenCLIP embeddings.
2) Text-to-image retrieval (`query_texts`).
3) Image-to-image retrieval (`query_uris`).
"""

from __future__ import annotations

import shutil
from itertools import zip_longest
from pathlib import Path
from typing import Any

import chromadb

SCRIPT_DIR = Path(__file__).resolve().parent
BASE_DIR = SCRIPT_DIR / "chroma_data" / "image_search_example"
IMAGE_DIR = SCRIPT_DIR / "images"
COLLECTION_NAME = "image_search_demo_python"


def _first_result_group(results: dict[str, Any], key: str) -> list[Any]:
    groups = results.get(key, [])
    if isinstance(groups, list) and groups:
        first = groups[0]
        if isinstance(first, list):
            return first
    return []


def _build_openclip_components() -> tuple[Any, Any]:
    try:
        from chromadb.utils.data_loaders import ImageLoader
        from chromadb.utils.embedding_functions import OpenCLIPEmbeddingFunction
    except ImportError as exc:
        raise SystemExit(
            "Missing optional image-search dependencies. Install them with:\n"
            "  pip install -r examples/image-search/python/requirements.txt"
        ) from exc

    try:
        return OpenCLIPEmbeddingFunction(), ImageLoader()
    except Exception as exc:
        raise SystemExit(
            "OpenCLIP initialization failed. Ensure optional dependencies are installed:\n"
            "  pip install -r examples/image-search/python/requirements.txt"
        ) from exc


def _print_results(label: str, results: dict[str, Any]) -> None:
    ids = _first_result_group(results, "ids")
    uris = _first_result_group(results, "uris")
    distances = _first_result_group(results, "distances")
    metadatas = _first_result_group(results, "metadatas")

    print(f"\\n{label}")
    for idx, (doc_id, uri, distance, metadata) in enumerate(
        zip_longest(ids, uris, distances, metadatas, fillvalue=None), start=1
    ):
        if doc_id is None:
            continue
        print(
            f"  rank={idx} id={doc_id} distance={distance} "
            f"uri={Path(uri).name if uri else None} metadata={metadata}"
        )


def main() -> None:
    if BASE_DIR.exists():
        shutil.rmtree(BASE_DIR)

    embedding_function, image_loader = _build_openclip_components()

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
        metadatas=[{"label": label} for label in images],
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

    top_ids = _first_result_group(image_to_image_results, "ids")
    if not top_ids:
        raise AssertionError("image-to-image query returned no IDs")
    if top_ids[0] != "dog-with-person":
        raise AssertionError("expected query image to match itself as top result")

    print("\\npython: image search example passed")


if __name__ == "__main__":
    main()
