$(document).ready(function(){
    var mouseX, mouseY;
    var ww = $( window ).width();
    var wh = $( window ).height();
    var traX, traY;
    $(document).mousemove(function(e){
      mouseX = e.pageX;
      mouseY = e.pageY;
      traX = ((4 * mouseX) / 570) + 40;
      traY = ((4 * mouseY) / 570) + 50;
      console.log(traX);
      $(".title").css({"background-position": traX + "%" + traY + "%"});
    });
  });

document.addEventListener("DOMContentLoaded", function () {
    const slides = document.querySelectorAll('.gallery-item');
    const prevBtn = document.querySelector('.prev');
    const nextBtn = document.querySelector('.next');
    let currentIndex = 0;

    function showSlide(index) {
        const totalSlides = slides.length;
        if (index >= totalSlides) {
            currentIndex = 0;
        } else if (index < 0) {
            currentIndex = totalSlides - 1;
        } else {
            currentIndex = index;
        }
        const offset = -currentIndex * 100;
        document.querySelector('.gallery-slides').style.transform = `translateX(${offset}%)`;
    }

    nextBtn.addEventListener('click', function () {
        showSlide(currentIndex + 1);
    });

    prevBtn.addEventListener('click', function () {
        showSlide(currentIndex - 1);
    });

    // Initialiser le slider
    showSlide(currentIndex);
});


