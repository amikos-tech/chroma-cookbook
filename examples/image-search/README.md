# Image Search Examples

This example demonstrates multimodal retrieval in Chroma with OpenCLIP:

- index local images using `uris`
- run text-to-image queries with `query_texts`
- run image-to-image queries with `query_uris`

## Python

```bash
cd examples/image-search/python
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python image_search.py
```

Notes:

- The first run downloads the OpenCLIP model weights and may take longer.
- Data is stored in `examples/image-search/python/chroma_data/image_search_example`.
- Sample images are included under `examples/image-search/python/images`.
