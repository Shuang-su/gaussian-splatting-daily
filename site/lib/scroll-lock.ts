let count = 0;
let previous = "";

/** Multiple overlays can hand off during a React commit in either order. */
export function lockDocumentScroll() {
  const { style } = document.body;
  if (count === 0) {
    previous = style.overflow;
    style.overflow = "hidden";
  }
  count += 1;
  let locked = true;
  return () => {
    if (!locked) return;
    locked = false;
    count -= 1;
    if (count === 0) style.overflow = previous;
  };
}
