# Compositional Robot Learning

Website for compositional and modular learning in robotics: workshops, a reading list and background papers.

Site: https://compositional-robot.github.io/

## Where the content lives

All papers, workshops and thumbnails live in
[awesome-compositional-robot-learning](https://github.com/compositional-robot/awesome-compositional-robot-learning).
That repository is published with GitHub Pages under this same domain, and this page reads its
`data/*.json` files from `/awesome-compositional-robot-learning/`. To add or fix a paper, open a pull
request there. This repository only holds the page itself (`index.html` and `assets/`).

## Run locally

Clone both repositories side by side, then serve their parent folder so the data path resolves:

```bash
git clone git@github.com:compositional-robot/compositional-robot.github.io.git
git clone git@github.com:compositional-robot/awesome-compositional-robot-learning.git
python3 -m http.server 8000
# open http://localhost:8000/compositional-robot.github.io/
```
