(function () {
  if (customElements.get('lc-icon')) return;
  var ready = window.lucide ? Promise.resolve() : new Promise(function (res) {
    var s = document.createElement('script');
    s.src = 'https://unpkg.com/lucide@0.460.0/dist/umd/lucide.min.js';
    s.onload = res; document.head.appendChild(s);
  });
  var pascal = function (n) { return n.replace(/(^|-)([a-z0-9])/g, function (m, a, b) { return b.toUpperCase(); }); };
  class LcIcon extends HTMLElement {
    static get observedAttributes() { return ['name', 'size', 'stroke']; }
    connectedCallback() { this.render(); }
    attributeChangedCallback() { if (this.isConnected) this.render(); }
    render() {
      var size = this.getAttribute('size') || '20';
      this.style.display = 'inline-flex'; this.style.flexShrink = '0';
      this.style.width = size + 'px'; this.style.height = size + 'px';
      var self = this;
      ready.then(function () {
        var node = window.lucide.icons[pascal(self.getAttribute('name') || '')];
        if (!node) { self.replaceChildren(); return; }
        var el = window.lucide.createElement(node);
        el.setAttribute('width', size); el.setAttribute('height', size);
        el.setAttribute('stroke-width', self.getAttribute('stroke') || '2');
        self.replaceChildren(el);
      });
    }
  }
  customElements.define('lc-icon', LcIcon);
})();
