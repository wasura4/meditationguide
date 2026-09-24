import createDOMPurify, { type WindowLike } from "dompurify";

export interface ArticleSection {
  id: string;
  title: string;
  level: number;
}
export interface PreparedArticle {
  html: string;
  text: string;
  sections: ArticleSection[];
  videoOnly: boolean;
}

/** Run in a browser (or a DOM test environment), never render unsanitized CMS HTML. */
export function prepareArticle(
  content: string,
  window: WindowLike,
): PreparedArticle {
  const purifier = createDOMPurify(window);
  const config = {
    ALLOWED_TAGS: [
      "p",
      "br",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "blockquote",
      "ul",
      "ol",
      "li",
      "a",
      "img",
      "figure",
      "figcaption",
      "hr",
      "pre",
      "code",
      "table",
      "thead",
      "tbody",
      "tfoot",
      "tr",
      "th",
      "td",
      "details",
      "summary",
      "div",
      "span",
      "iframe",
    ],
    ALLOWED_ATTR: [
      "href",
      "src",
      "alt",
      "title",
      "colspan",
      "rowspan",
      "scope",
      "open",
      "id",
      "style",
      "target",
      "rel",
      "loading",
      "allowfullscreen",
      "referrerpolicy",
      "tabindex",
      "start",
    ],
    ALLOW_DATA_ATTR: false,
  };
  purifier.addHook("uponSanitizeAttribute", (_node, data) => {
    if (data.attrName === "style") {
      const alignment = data.attrValue.match(
        /(?:^|;)\s*text-align:\s*(left|right|center|justify)\s*(?:;|$)/i,
      );
      data.keepAttr = Boolean(alignment);
      data.attrValue = alignment
        ? `text-align: ${alignment[1].toLowerCase()}`
        : "";
    }
    if (data.attrName === "src" || data.attrName === "href") {
      // Anchors and relative URLs are safe; data, javascript and other protocols are not.
      data.keepAttr = /^(https?:\/\/|\/(?!\/)|#)/i.test(data.attrValue);
    }
  });
  const fragment = purifier.sanitize(content, {
    ...config,
    RETURN_DOM_FRAGMENT: true,
  });
  const sections: ArticleSection[] = [];
  const anchorMap = new Map<string, string>();
  fragment.querySelectorAll("h1,h2,h3").forEach((heading, index) => {
    const id = `reader-section-${index + 1}`;
    const oldId = heading.getAttribute("id");
    if (oldId) anchorMap.set(oldId, id);
    sections.push({
      id,
      title: heading.textContent?.trim() || "",
      level: heading.tagName === "H3" ? 3 : 2,
    });
  });
  fragment
    .querySelectorAll("[id]")
    .forEach((node) => node.removeAttribute("id"));
  fragment.querySelectorAll("h1,h2,h3").forEach((heading, index) => {
    heading.id = sections[index].id;
    heading.setAttribute("tabindex", "-1");
  });
  fragment.querySelectorAll("a").forEach((link) => {
    const href = link.getAttribute("href") || "";
    if (href.startsWith("#") && anchorMap.has(href.slice(1)))
      link.setAttribute("href", `#${anchorMap.get(href.slice(1))}`);
    link.setAttribute("rel", "noopener noreferrer");
    link.removeAttribute("target");
  });
  fragment.querySelectorAll("img").forEach((img) => {
    img.setAttribute("loading", "lazy");
  });
  fragment.querySelectorAll("iframe").forEach((frame) => {
    let url: URL;
    try {
      url = new URL(frame.getAttribute("src") || "");
    } catch {
      frame.remove();
      return;
    }
    if (
      ![
        "www.youtube.com",
        "youtube.com",
        "www.youtube-nocookie.com",
        "youtube-nocookie.com",
      ].includes(url.hostname) ||
      !/^\/embed\/[\w-]{11}$/.test(url.pathname) ||
      !["http:", "https:"].includes(url.protocol)
    ) {
      frame.remove();
      return;
    }
    frame.setAttribute(
      "src",
      `https://www.youtube-nocookie.com${url.pathname}`,
    );
    frame.setAttribute("title", frame.getAttribute("title") || "YouTube");
    frame.setAttribute("loading", "lazy");
    frame.setAttribute("allowfullscreen", "");
    frame.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
  });
  const container = window.document!.createElement("div");
  container.append(fragment);
  // Re-sanitize after DOM normalization, with the same restrictive allowlist.
  return {
    html: purifier.sanitize(container.innerHTML, config),
    text: container.textContent?.replace(/\u00a0/g, ' ').trim() || '',
    sections: sections.filter((section) => section.title),
    videoOnly:
      Boolean(container.querySelector("iframe")) &&
      !container.textContent?.trim() &&
      !container.querySelector("img"),
  };
}
