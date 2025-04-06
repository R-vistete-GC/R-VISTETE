// Función para calcular días entre dos fechas
function calcularDias(fechaInicio, fechaFin) {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const diferencia = fin.getTime() - inicio.getTime();
    return Math.ceil(diferencia / (1000 * 3600 * 24));
}

// Función para actualizar el resumen del alquiler
function actualizarResumenAlquiler() {
    const fechaInicio = document.getElementById('fechaInicio').value;
    const fechaFin = document.getElementById('fechaFin').value;
    
    if (fechaInicio && fechaFin) {
        const dias = calcularDias(fechaInicio, fechaFin);
        if (dias < 0) {
            alert('La fecha de devolución debe ser posterior a la fecha de inicio');
            document.getElementById('fechaFin').value = '';
            return;
        }
        
        const precioDia = parseFloat(document.getElementById('alquilerPrecioDia').textContent.replace('€', ''));
        const deposito = parseFloat(document.getElementById('alquilerDeposito').textContent.replace('€', ''));
        
        const subtotal = dias * precioDia;
        const total = subtotal + deposito;
        
        document.getElementById('alquilerDiasTotales').textContent = dias;
        document.getElementById('alquilerSubtotal').textContent = subtotal.toFixed(2) + '€';
        document.getElementById('alquilerTotal').textContent = total.toFixed(2) + '€';
    }
}

// Event listeners para las fechas
document.addEventListener('DOMContentLoaded', function() {
    const fechaInicio = document.getElementById('fechaInicio');
    const fechaFin = document.getElementById('fechaFin');
    
    if (fechaInicio && fechaFin) {
        fechaInicio.addEventListener('change', actualizarResumenAlquiler);
        fechaFin.addEventListener('change', actualizarResumenAlquiler);
    }
}); 