$(document).on("DOMContentLoaded", function () {

  const $menu = $("#menu-lateral");
  const $overlay = $("#overlay");

  function abrirMenu() {
    $menu.addClass("abierto");
    $overlay.addClass("visible");
  }

  function cerrarMenu() {
    $menu.removeClass("abierto");
    $overlay.removeClass("visible");
  }

  $("#btn-abrir").on("click", abrirMenu);
  $("#btn-cerrar").on("click", cerrarMenu);
  $overlay.on("click", cerrarMenu);

  $(document).on("keydown", (e) => {
    if (e.key === "Escape") cerrarMenu();
  });

});