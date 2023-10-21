const modal = document.getElementById("modal");
const modalImage = document.getElementById("modalImage");
const captionText = document.getElementById("caption");
const galleryItems = document.querySelectorAll(".gallery-item");

galleryItems.forEach(item => {
    item.addEventListener("click", function() {
        modal.style.display = "block";
        const src = this.getAttribute("data-image");
        modalImage.src = src;
        captionText.innerHTML = this.querySelector("p").textContent;
    });
});

function closeModal() {
    modal.style.display = "none";
}
