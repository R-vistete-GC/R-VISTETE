document.addEventListener('DOMContentLoaded', () => {
    console.log('Archivo recommendations.js cargado correctamente.');

    const actualizarRecomendaciones = () => {
        fetch('/recommendations/api/')
            .then(response => response.json())
            .then(data => {
                const recomendacionesContainer = document.getElementById('recomendacionesContainer');
                if (data.recomendaciones && data.recomendaciones.length > 0) {
                    let html = '';
                    data.recomendaciones.forEach(rec => {
                        html += `
                            <div class="col-md-4 mb-4">
                                <div class="card h-100 shadow-hover">
                                    <img src="${rec.imagen}" class="card-img-top" alt="${rec.titulo}" style="height: 300px; object-fit: cover;">
                                    <div class="card-body">
                                        <h5 class="card-title">${rec.titulo}</h5>
                                        <p class="card-text">Puntuación: ${rec.puntuacion}%</p>
                                        <ul>
                                            ${rec.razones.map(razon => `<li>${razon}</li>`).join('')}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        `;
                    });
                    recomendacionesContainer.innerHTML = html;
                } else {
                    recomendacionesContainer.innerHTML = `
                        <div class="alert alert-info">
                            No encontramos recomendaciones en este momento.
                        </div>
                    `;
                }
            })
            .catch(error => console.error('Error al actualizar las recomendaciones:', error));
    };

    // Llamar a la función cada 30 segundos
    setInterval(actualizarRecomendaciones, 30000);

    // Llamar a la función inmediatamente al cargar la página
    actualizarRecomendaciones();
});