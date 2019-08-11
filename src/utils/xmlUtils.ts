import parseXml, { Element, NodeBase } from "@rgrove/parse-xml";

// export function parseChildren(children: any) {
//   const newChildren = [...children];
//   for (let i = newChildren.length - 1; i >= 0; i--) {
//     const node = newChildren[i];
//     if (node.type === "text" && node.text.trim() === "") {
//       newChildren.splice(i, 1);
//     }
//   }
//   return newChildren;
// }

export function loadXml(xmlString: string) {
  const doc = parseXml(xmlString);
  console.log("raw");

  // empty text nodes
  // challenge: stack so no recursion
  const stack: Element[] = [doc.children[0] as Element];
  let index = 0;
  while (stack.length !== 0) {
    if (stack.length > 50) {
      console.log("fuck!", stack);
      break;
    }
    const cur = stack[stack.length - 1];
    if (cur.children.length === index) {
      // end of children
      if (stack.length === 2) {
        // end of array
        break;
      }
      const parent = stack[stack.length - 2];
      // console.log("parent", parent)
      index = parent.children.indexOf(cur) + 1;
      stack.pop();
      continue;
    }
    const child = cur.children[index];
    // console.log("child", child)

    switch (child.type) {
      case "element":
        index = 0;
        stack.push(child as Element);
        break;
      case "text":
        const childNode = child as parseXml.Text;
        if (childNode.text.trim() === "") {
          cur.children.splice(index, 1);
        } else {
          index++;
        }
        break;
      default:
        throw new Error("unknown type " + child.type);
        break;
    }
  }
  return doc;
}

export function loadAtom(xmlString: string) {
  const doc = loadXml(xmlString);
  if (doc.children.length !== 1) {
    throwXmlError(doc, "unexpected number of children");
  }
  const feed = getElement(doc, "feed");
  return feed;
}

export function getElement(element: any, childName: string) {
  if (element.type !== "element" && element.type !== "document") {
    throw new Error("unknown argument " + element);
  }

  for (const child of element.children) {
    if (child.type === "element" && child.name === childName) {
      return child;
    }
  }
  console.error("root", element);
  throw new Error("cannot find child element " + childName);
}

export function getElements(element: any, childName: string) {
  if (element.type !== "element" && element.type !== "document") {
    throw new Error("unknown argument " + element);
  }

  const result = [];
  for (const child of element.children) {
    if (child.type === "element" && child.name === childName) {
      result.push(child);
    }
  }

  if (result.length === 0) {
    console.error("root", element);
    throw new Error("cannot find child elements " + childName);
  }
  return result;
}

export function getElementText(element: any, childName: string) {
  if (element.type !== "element" && element.type !== "document") {
    throw new Error("unknown argument " + element);
  }

  const child = getElement(element, childName);
  if (child.children.length !== 1) {
    throwXmlError(child, "unexpected child length " + child.children.length);
  }
  const textChild = child.children[0];
  if (textChild.type !== "text") {
    throwXmlError(textChild, "unexpected child type ");
  }
  return textChild.text;
}

function throwXmlError(element: any, message: string) {
  console.error("error element", element);
  throw new Error(message);
}
