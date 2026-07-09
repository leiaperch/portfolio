// Construction DOM sûre — aucune écriture via `innerHTML` sur des éléments live.
// el()        : crée un élément (props + enfants texte/nœud, tableaux aplatis).
// parseHTML() : parse une chaîne de CONFIANCE (i18n contrôlé, ex. <b> de la
//               tagline) via DOMParser, qui produit un document inerte (aucun
//               script exécuté, aucune ressource chargée). Renvoie un fragment.
// clear()     : vide un nœud sans toucher à innerHTML.

export function el(tag, props, ...children) {
  const node = document.createElement(tag);
  if (props) {
    for (const k in props) {
      const v = props[k];
      if (v == null || v === false) continue;
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else if (k === 'dataset') { for (const d in v) if (v[d] != null) node.dataset[d] = v[d]; }
      else if (k.charCodeAt(0) === 111 && k.charCodeAt(1) === 110 && typeof v === 'function') node.addEventListener(k.slice(2), v); // onclick…
      else node.setAttribute(k, v === true ? '' : v);
    }
  }
  appendChildren(node, children);
  return node;
}

function appendChildren(node, children) {
  for (const c of children) {
    if (c == null || c === false) continue;
    if (Array.isArray(c)) appendChildren(node, c);
    else node.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
}

let parser;
export function parseHTML(str) {
  parser ||= new DOMParser();
  const body = parser.parseFromString(String(str), 'text/html').body;
  const frag = document.createDocumentFragment();
  for (const child of [...body.childNodes]) frag.append(document.importNode(child, true));
  return frag;
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}
