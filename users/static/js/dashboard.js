document.addEventListener('DOMContentLoaded', () => {
    console.log('Archivo dashboard.js cargado correctamente.');

   
    const recomendacionesDataElement = document.getElementById('recomendacionesData');
    if (recomendacionesDataElement) {
        const recomendacionesData = JSON.parse(recomendacionesDataElement.textContent);
        console.log('Datos de recomendaciones:', recomendacionesData);
    } else {
        console.error('El elemento recomendacionesData no existe en el DOM.');
    }

   

   
    // Gráfica de Estilo y Color
    const estiloColorCtx = document.getElementById('graficaEstiloColor');
    if (estiloColorCtx) {
        fetch('/users/dashboard/recomendaciones-estilo-color/')
            .then(response => response.json())
            .then(data => {
                console.log('Datos recibidos para la gráfica de estilo y color:', data);

                const estilos = Object.keys(data); // Estilos como 'casual', 'formal', etc.
                const colores = Object.keys(data[estilos[0]]); // Colores como 'azul', 'negro', etc.

                // Preparar datasets para cada color
                const datasets = colores.map(color => ({
                    label: color, // Nombre del color
                    data: estilos.map(estilo => data[estilo][color]), // Valores para cada estilo
                    borderColor: getColorForLabel(color), // Asignar color a la línea
                    backgroundColor: getColorForLabel(color),
                    fill: false,
                    tension: 0.1
                }));

                // Crear la gráfica
                new Chart(estiloColorCtx, {
                    type: 'line', // Gráfica lineal
                    data: {
                        labels: estilos, // Etiquetas en el eje X (estilos)
                        datasets: datasets // Conjuntos de datos (colores)
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                position: 'top' // Posición de la leyenda
                            },
                            title: {
                                display: true,
                                text: 'Recomendaciones por Estilo y Color'
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true // Comenzar el eje Y desde 0
                            }
                        }
                    }
                });
            })
            .catch(error => console.error('Error al cargar datos de estilo y color:', error));
    }

    

    // Llamar a la función cada 30 segundos
    setInterval(actualizarEstadisticas, 30000);

    // Llamar a la función inmediatamente al cargar la página
    actualizarEstadisticas();
});

// Función para asignar colores a las líneas
function getColorForLabel(label) {
    const colorMap = {
        'azul': '#36A2EB',
        'negro': '#000000',
        'rojo': '#FF6384',
        'verde': '#4BC0C0',
        'amarillo': '#FFCE56',
        'blanco': '#FFFFFF',
        'gris': '#808080',
        'marrón': '#A52A2A'
    };
    return colorMap[label] || '#000000';
}