function onload() {
  console.log("init")

  for (const formElem of document.getElementsByClassName("ajaxform")) {
    console.log("parsing ", formElem)

    formElem.addEventListener("submit", (e) => {
      console.log("intercepted form")

      if (e.preventDefault) {
        e.preventDefault();
      }

      const fd = new FormData(formElem)
      // for(const e of fd) {
      //   console.log("e", e)
      // }
      fd.set(formElem.querySelector("button[type='submit']").getAttribute("name"), "")
      fetch(window.location, {
        method: 'POST',
        body: fd
      })
      .then(result => {
        result.text()
        .then(textRes => alert('Success:' + textRes))
        .catch(textErr => alert("Text error: " + textErr))
        
      })
      .catch(error => {
        alert('Error:' + error);
      });
    });
  }
}
window.addEventListener("load", onload)
