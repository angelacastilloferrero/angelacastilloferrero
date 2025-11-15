const draggableElements = document.querySelectorAll('.window');

let activeItem = null;
let isResizing = false;
let isPinching = false; // Bandera para saber si estamos en modo pellizco

let currentX, currentY;
let initialX, initialY;
let xOffset, yOffset;

let initialWidth, initialHeight;
let initialRatio;
let initialDistance = 0; // Distancia inicial entre los dos dedos para redimensionar
let highestZIndex = 100;

const FOOTER_HEIGHT = 35; 
const BODY_MARGIN = 15; // El margen del body definido en CSS

// ======================================================================
// FUNCIÓN PARA CALCULAR LA POSICIÓN INICIAL (AJUSTADA AL CENTRO DEL ABOUT ME)
// ======================================================================
function randomizeWindowPosition(windowElement) {
    const aboutContainer = document.querySelector('.about-container');

    if (!aboutContainer) return; // Si no hay About, salimos

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const elementWidth = windowElement.offsetWidth;
    const elementHeight = windowElement.offsetHeight;

    // 1. Obtener la posición y dimensiones del about-container
    const aboutRect = aboutContainer.getBoundingClientRect();
    
    // Calcular el centro del about-container
    const aboutCenterX = aboutRect.left + (aboutRect.width / 2);
    const aboutCenterY = aboutRect.top + (aboutRect.height / 2);

    // 2. Calcular la posición base para que el centro de la ventana coincida con el centro del about
    let baseX = aboutCenterX - (elementWidth / 2);
    let baseY = aboutCenterY - (elementHeight / 2);

    // 3. Definir un rango de dispersión (± 400px para mayor separación lateral).
    const scatterRange = 600; 
    const randomOffsetX = Math.random() * scatterRange - (scatterRange / 3); // De -200 a +200
    const randomOffsetY = Math.random() * scatterRange - (scatterRange / 3); // De -200 a +200

    let targetX = baseX + randomOffsetX;
    let targetY = baseY + randomOffsetY;

    // 4. Aplicar límites de borde (Asegurar que la ventana no se salga)
    const MIN_LEFT = BODY_MARGIN;
    const MIN_TOP = BODY_MARGIN;
    const MAX_LEFT = viewportWidth - elementWidth - BODY_MARGIN;
    const MAX_TOP = viewportHeight - elementHeight - BODY_MARGIN;
    
    // Limitar la posición
    targetX = Math.min(Math.max(targetX, MIN_LEFT), MAX_LEFT);
    targetY = Math.min(Math.max(targetY, MIN_TOP), MAX_TOP);
    
    // Aplicar la posición
    windowElement.style.top = targetY + 'px';
    windowElement.style.left = targetX + 'px';
}

// Función para actualizar las dimensiones en el footer del texto
function updateDimensionsText(windowElement) {
    const currentWidth = Math.round(windowElement.offsetWidth);
    // El alto de la imagen es el alto total menos la altura fija del footer
    const currentBodyHeight = Math.round(windowElement.offsetHeight - FOOTER_HEIGHT);

    const dimensionsSpan = windowElement.querySelector('.dimensions-text');
    if (dimensionsSpan) {
        dimensionsSpan.textContent = `(${currentWidth}x${currentBodyHeight})`;
    }
}

// Función para establecer el tamaño inicial y la proporción
function initializeWindow(windowElement) {
    const img = windowElement.querySelector('img');

    const loadHandler = () => {
        setInitialDimensions(windowElement, img);
        // Llamamos a randomizeWindowPosition aquí para obtener la posición centrada
        randomizeWindowPosition(windowElement); 
    };

    if (img && img.complete) {
        loadHandler();
    } else if (img) {
        img.onload = loadHandler;
    } else {
        setInitialDimensions(windowElement, null);
        randomizeWindowPosition(windowElement);
    }
}

function setInitialDimensions(windowElement, img) {
    // Tamaño inicial aleatorio (pero proporcional)
    const MIN_WIDTH = 200;
    const MAX_WIDTH = 400;

    // Generar un ancho aleatorio entre 200px y 400px
    const randomWidth = Math.random() * (MAX_WIDTH - MIN_WIDTH) + MIN_WIDTH;

    let ratio = 1;
    if (img && img.naturalWidth && img.naturalHeight) {
        ratio = img.naturalWidth / img.naturalHeight;
    }

    const targetWidth = randomWidth;
    const targetHeight = targetWidth / ratio;

    windowElement.style.width = targetWidth + 'px';
    windowElement.style.height = (targetHeight + FOOTER_HEIGHT) + 'px';

    windowElement.setAttribute('data-aspect-ratio', ratio);

    updateDimensionsText(windowElement);
}

// 1. Configuración de escuchadores de eventos
draggableElements.forEach(item => {
    const resizeHandle = item.querySelector('.resize-handle');

    initializeWindow(item);

    item.addEventListener('mousedown', startInteraction);
    item.addEventListener('touchstart', startInteraction);

    if (resizeHandle) {
        resizeHandle.addEventListener('mousedown', resizeStart);
        resizeHandle.addEventListener('touchstart', resizeStart);
    }
});

// Eventos globales en el documento
document.addEventListener('mouseup', dragEnd);
document.addEventListener('touchend', dragEnd);
document.addEventListener('mousemove', drag);
document.addEventListener('touchmove', drag);

// Función para elevar la ventana clicada
function elevateWindow(clickedWindow) {
    highestZIndex++;
    clickedWindow.style.zIndex = highestZIndex;
}

/* ==================== INICIO DE INTERACCIÓN (Arrastre/Pellizco) ==================== */

function startInteraction(e) {
    // Si ya estamos redimensionando con el handle, no hacemos nada más
    if (e.target.classList.contains('resize-handle')) {
        return;
    }
    
    // Ignorar el clic si se hace en el handle de redimensión, botón o enlaces
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.tagName === 'INPUT') {
        return;
    }

    const isTouch = e.type.includes('touch');

    if (isTouch && e.touches.length === 2) {
        // --- INICIO DE PELLIZCO (PINCH-TO-ZOOM) ---
        e.preventDefault();
        
        activeItem = this; // 'this' es la ventana (.window)
        elevateWindow(activeItem);
        
        isPinching = true;
        isResizing = true; // Usamos la bandera de redimensionar para el drag
        activeItem.classList.add('active-resize');

        // 1. Calcular la distancia inicial entre los dos dedos
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialDistance = Math.sqrt(dx * dx + dy * dy);

        // 2. Guardar las dimensiones iniciales
        initialWidth = activeItem.offsetWidth;
        initialHeight = activeItem.offsetHeight;
        initialRatio = parseFloat(activeItem.getAttribute('data-aspect-ratio')) || (initialWidth / (initialHeight - FOOTER_HEIGHT));

        return; // Salimos, no queremos arrastrar mientras pellizcamos
    }
    
    // --- INICIO DE ARRASTRE (DRAG) ---
    // Si hay más de un toque pero no dos exactos, ignoramos el arrastre
    if (isTouch && e.touches.length > 1) return; 

    e.preventDefault();
    isPinching = false;
    isResizing = false;

    const eventClientX = isTouch ? e.touches[0].clientX : e.clientX;
    const eventClientY = isTouch ? e.touches[0].clientY : e.clientY;

    activeItem = this;
    activeItem.classList.add('active-drag');

    elevateWindow(activeItem);

    const rect = activeItem.getBoundingClientRect();

    xOffset = eventClientX - rect.left;
    yOffset = eventClientY - rect.top;

    initialX = eventClientX;
    initialY = eventClientY;
}

/* ==================== INICIO DE REDIMENSIÓN (HANDLE) ==================== */

function resizeStart(e) {
    e.preventDefault();

    isResizing = true;
    isPinching = false; // Asegurarse de que no estamos en modo pellizco si usamos el handle
    const isTouch = e.type.includes('touch');

    activeItem = this.closest('.window');
    activeItem.classList.add('active-resize');
    elevateWindow(activeItem);

    initialX = isTouch ? e.touches[0].clientX : e.clientX;
    initialY = isTouch ? e.touches[0].clientY : e.clientY;

    initialWidth = activeItem.offsetWidth;
    initialHeight = activeItem.offsetHeight;

    initialRatio = parseFloat(activeItem.getAttribute('data-aspect-ratio')) || (initialWidth / (initialHeight - FOOTER_HEIGHT));
}


/* ==================== FUNCIÓN DE MOVIMIENTO (DRAG/RESIZE) ==================== */

function drag(e) {
    if (!activeItem) return;
    e.preventDefault();

    const isTouch = e.type.includes('touch');
    // Usamos el primer toque para el arrastre y el cursor. Puede ser null si el primer toque ya no existe
    const eventClientX = isTouch ? (e.touches[0] ? e.touches[0].clientX : null) : e.clientX;
    const eventClientY = isTouch ? (e.touches[0] ? e.touches[0].clientY : null) : e.clientY;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const itemWidth = activeItem.offsetWidth;
    const itemHeight = activeItem.offsetHeight;
    const MIN_LEFT = BODY_MARGIN;
    const MIN_TOP = BODY_MARGIN;

    if (isResizing) {
        let newWidth, newBodyHeight;

        if (isPinching && isTouch && e.touches.length === 2) {
            // --- MODO REDIMENSIÓN: PELLIZCO (PINCH-TO-ZOOM) ---
            const currentDx = e.touches[0].clientX - e.touches[1].clientX;
            const currentDy = e.touches[0].clientY - e.touches[1].clientY;
            const currentDistance = Math.sqrt(currentDx * currentDx + currentDy * currentDy);
            
            // Factor de escala
            const scaleFactor = currentDistance / initialDistance;

            // Aplicar el factor de escala a las dimensiones iniciales
            newWidth = initialWidth * scaleFactor;
            newBodyHeight = (initialHeight - FOOTER_HEIGHT) * scaleFactor;

        } else {
            // --- MODO REDIMENSIÓN: HANDLE INFERIOR DERECHO ---
            const deltaX = eventClientX - initialX;
            const deltaY = eventClientY - initialY;

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Guiar por el ancho
                newWidth = Math.max(initialWidth + deltaX, 150);
                newBodyHeight = newWidth / initialRatio;
            } else {
                // Guiar por el alto
                let newHeight = Math.max(initialHeight + deltaY, 100);
                newBodyHeight = newHeight - FOOTER_HEIGHT;
                if (newBodyHeight > 0) {
                    newWidth = newBodyHeight * initialRatio;
                } else {
                    newBodyHeight = 100 - FOOTER_HEIGHT; // Mínimo 100px de altura de ventana
                    newWidth = newBodyHeight * initialRatio;
                }
            }
        }
        
        // --- LÓGICA DE APLICACIÓN DE TAMAÑO Y LÍMITES (Común a Handle y Pinch) ---
        let newHeight = newBodyHeight + FOOTER_HEIGHT;

        if (newWidth >= 150 && newHeight >= 100) {
            // Limitar el tamaño de redimensión para no salirse de la web
            let currentLeft = parseFloat(activeItem.style.left) || 0;
            let currentTop = parseFloat(activeItem.style.top) || 0;

            let maxPossibleWidth = viewportWidth - currentLeft - BODY_MARGIN;
            let maxPossibleHeight = viewportHeight - currentTop - BODY_MARGIN;

            if (newWidth > maxPossibleWidth) {
                 newWidth = maxPossibleWidth;
                 newBodyHeight = newWidth / initialRatio;
                 newHeight = newBodyHeight + FOOTER_HEIGHT;
            }

            if (newHeight > maxPossibleHeight) {
                 newHeight = maxPossibleHeight;
                 newBodyHeight = newHeight - FOOTER_HEIGHT;
                 newWidth = newBodyHeight * initialRatio;
            }

            activeItem.style.width = newWidth + 'px';
            activeItem.style.height = newHeight + 'px';
            updateDimensionsText(activeItem);
        }

    } else {
        // Modo Arrastre
        if (eventClientX === null || eventClientY === null) return; // Evitar arrastre con 2 toques que pierden e.touches[0]
        
        currentX = eventClientX - xOffset;
        currentY = eventClientY - yOffset;

        // Asegurarse de que no se salga de la web
        const maxX = viewportWidth - itemWidth - BODY_MARGIN;
        const maxY = viewportHeight - itemHeight - BODY_MARGIN;

        // Aplicar límites
        currentX = Math.min(Math.max(currentX, MIN_LEFT), maxX);
        currentY = Math.min(Math.max(currentY, MIN_TOP), maxY);

        activeItem.style.left = currentX + 'px';
        activeItem.style.top = currentY + 'px';
    }
}


/* ==================== FUNCIÓN DE FINALIZACIÓN ==================== */

function dragEnd(e) {
    if (!activeItem) return;

    // Lógica para evitar que el dragEnd se dispare al levantar solo un dedo durante el pellizco
    const isTouch = e.type.includes('touch');
    if (isPinching && isTouch && e.touches.length > 0) {
        return;
    }

    activeItem.classList.remove('active-drag', 'active-resize');
    updateDimensionsText(activeItem);

    activeItem = null;
    isResizing = false;
    isPinching = false; // Reiniciamos la bandera de pellizco
    initialDistance = 0; // Reiniciamos la distancia inicial
}

// Llamada inicial para asegurar que todas las imágenes se inicialicen
window.addEventListener('load', () => {
      draggableElements.forEach(item => initializeWindow(item));
});

// Al redimensionar la ventana del navegador, ajusta la posición de las ventanas abiertas.
window.addEventListener('resize', () => {
    draggableElements.forEach(item => {
        randomizeWindowPosition(item); // Reajusta los límites
    });
});

// --- FUNCIONES DEL FORMULARIO DE CORREO ---

// Hacemos que estas funciones sean globales (accesibles desde el HTML)
window.handlePortfolioRequest = function() {
    const emailInput = document.getElementById('emailInput');
    const portfolioButton = document.getElementById('portfolioButton');
    const recipientEmail = "castilloferreroangela@gmail.com";
    
    // Si el input está visible y el correo es válido (o tiene algún contenido)
    if (emailInput.classList.contains('visible') && emailInput.value.length > 0) {
        
        // Crear el enlace mailto:
        const subject = "Solicitud de Portfolio Completo";
        const body = `Hola, me gustaría solicitar el portfolio completo. Mi correo es: ${emailInput.value}`;
        
        const mailtoLink = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        // Abrir el cliente de correo del usuario
        window.location.href = mailtoLink;
        
    } else {
        // Estado inicial: Muestra el campo de correo
        emailInput.classList.add('visible');
        emailInput.focus(); // Pone el cursor en el campo
        
        // Comprueba si ya está listo para "send!" (en caso de que el usuario haga clic de nuevo)
        checkEmailStatus();
    }
}

// Hacemos que esta función sea global (accesible desde el HTML)
window.checkEmailStatus = function() {
    const emailInput = document.getElementById('emailInput');
    const portfolioButton = document.getElementById('portfolioButton');
    
    // Utiliza un regex simple para comprobar si parece un correo
    const emailPattern = /\S+@\S+\.(com|net|org|es|gov|edu|io|co|info|biz)/i;

    if (emailInput.classList.contains('visible') && emailPattern.test(emailInput.value)) {
        portfolioButton.textContent = "send!";
    } else {
        portfolioButton.textContent = "request full portfolio";
    }
}
