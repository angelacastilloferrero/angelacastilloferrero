const draggableElements = document.querySelectorAll('.window');

let activeItem = null;
let isResizing = false;
let isPinching = false; // Bandera para saber si estamos en modo pellizco

let currentX, currentY;
let initialX, initialY;
let xOffset, yOffset;

let initialWidth, initialHeight;
let initialRatio;const draggableElements = document.querySelectorAll('.window');

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

// Nuevas variables para un redimensionamiento por pellizco limpio
let initialLeft, initialTop;

// NUEVA VARIABLE: Almacena la dirección de redimensionamiento (e.g., 'right', 'bottom', 'top-left', 'handle')
let resizeDirection = ''; 

const RESIZE_AREA = 8; // Área de 8px alrededor del borde para activar el resize

const FOOTER_HEIGHT = 35;
const BODY_MARGIN = 15; // El margen del body definido en CSS

// ======================================================================
// FUNCIÓN PARA CALCULAR LA POSICIÓN INICIAL (AJUSTADA AL CENTRO DEL ABOUT ME)
// (Mantenida igual)
// ======================================================================
function randomizeWindowPosition(windowElement) {
    const aboutContainer = document.querySelector('.about-container');

    if (!aboutContainer) return;

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
    const randomOffsetX = Math.random() * scatterRange - (scatterRange / 3);
    const randomOffsetY = Math.random() * scatterRange - (scatterRange / 3);

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
// (Mantenida igual)
function updateDimensionsText(windowElement) {
    const currentWidth = Math.round(windowElement.offsetWidth);
    const currentBodyHeight = Math.round(windowElement.offsetHeight - FOOTER_HEIGHT);

    const dimensionsSpan = windowElement.querySelector('.dimensions-text');
    if (dimensionsSpan) {
        dimensionsSpan.textContent = `(${currentWidth}x${currentBodyHeight})`;
    }
}

// Función para establecer el tamaño inicial y la proporción
// (Mantenida igual)
function initializeWindow(windowElement) {
    const img = windowElement.querySelector('img');

    const loadHandler = () => {
        setInitialDimensions(windowElement, img);
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
    const MIN_WIDTH = 200;
    const MAX_WIDTH = 400;

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

// Función para elevar la ventana clicada
// (Mantenida igual)
function elevateWindow(clickedWindow) {
    highestZIndex++;
    clickedWindow.style.zIndex = highestZIndex;
}

// ======================================================================
// NUEVA FUNCIÓN: Detecta si el cursor está en el borde de la ventana
// ======================================================================
function checkResizeBorders(e, windowElement) {
    const rect = windowElement.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;
    
    let direction = '';

    // Verifica si el clic está en el área de redimensionamiento (RESIZE_AREA)

    // Esquinas (prioridad a las esquinas sobre los bordes simples)
    const isTop = clientY < rect.top + RESIZE_AREA;
    const isBottom = clientY > rect.bottom - RESIZE_AREA;
    const isLeft = clientX < rect.left + RESIZE_AREA;
    const isRight = clientX > rect.right - RESIZE_AREA;

    // Redimensionamiento del borde superior (no en las esquinas)
    if (isTop && !isLeft && !isRight) {
        direction = 'top';
    } 
    // Redimensionamiento del borde inferior (no en las esquinas, y excluye el footer)
    else if (isBottom && !isLeft && !isRight) {
        // Solo permitimos redimensionar el borde inferior si no estamos tocando
        // el handle o el footer, pero como el handle es más pequeño, priorizamos el handle
        // y solo permitimos 'bottom' si no estamos en el handle.
        direction = 'bottom';
    }
    // Redimensionamiento del borde izquierdo (no en las esquinas)
    else if (isLeft && !isTop && !isBottom) {
        direction = 'left';
    }
    // Redimensionamiento del borde derecho (no en las esquinas)
    else if (isRight && !isTop && !isBottom) {
        direction = 'right';
    }
    // Redimensionamiento en las esquinas (se ajustan dos direcciones)
    else if (isTop && isLeft) {
        direction = 'top-left';
    } else if (isTop && isRight) {
        direction = 'top-right';
    } else if (isBottom && isLeft) {
        direction = 'bottom-left';
    }
    // La esquina inferior derecha la maneja el 'handle' o el 'pinch'

    return direction;
}


/* ==================== INICIO DE INTERACCIÓN (Arrastre/Pellizco/Borde) ==================== */

function startInteraction(e) {
    const windowElement = this;
    const isTouch = e.type.includes('touch');
    const isLeftClick = e.button === 0; // Solo para mousedown

    // 1. Manejo de Pellizco (Touch)
    if (isTouch && e.touches.length === 2) {
        // ... (Lógica de Pinch-to-zoom - Mantenida igual) ...
        e.preventDefault();
        activeItem = this; 
        elevateWindow(activeItem);
        isPinching = true;
        isResizing = true; 
        resizeDirection = 'pinch'; // Marcamos la dirección como pinch
        activeItem.classList.add('active-resize');

        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialDistance = Math.sqrt(dx * dx + dy * dy);

        initialWidth = activeItem.offsetWidth;
        initialHeight = activeItem.offsetHeight;
        initialLeft = parseFloat(activeItem.style.left) || 0;
        initialTop = parseFloat(activeItem.style.top) || 0;
        initialRatio = parseFloat(activeItem.getAttribute('data-aspect-ratio')) || (initialWidth / (initialHeight - FOOTER_HEIGHT));
        return; 
    }
    
    // 2. Comprobación de Controles Interactivos
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.tagName === 'INPUT' || e.target.classList.contains('resize-handle')) {
        // Si es el handle, la función resizeStart (adjunta al handle) lo manejará
        return;
    }

    // 3. Comprobación de Borde (Solo para Desktop: si NO es touch y es click izquierdo)
    if (!isTouch && isLeftClick) {
        // Detiene el arrastre si estamos en el borde
        const direction = checkResizeBorders(e, windowElement);
        
        if (direction !== '') {
            e.preventDefault();
            isResizing = true;
            isPinching = false;
            resizeDirection = direction; // Establece la dirección
            activeItem = windowElement;
            activeItem.classList.add('active-resize');
            elevateWindow(activeItem);

            initialX = e.clientX;
            initialY = e.clientY;
            initialWidth = windowElement.offsetWidth;
            initialHeight = windowElement.offsetHeight;
            initialLeft = parseFloat(windowElement.style.left) || 0;
            initialTop = parseFloat(windowElement.style.top) || 0;
            initialRatio = parseFloat(windowElement.getAttribute('data-aspect-ratio')) || (initialWidth / (initialHeight - FOOTER_HEIGHT));
            return; // Detiene el flujo para que no entre en el modo Arrastre
        }
    }
    
    // 4. Inicio de Arrastre (Drag - Común a Touch y Desktop si no hay redimensionamiento)
    if (isTouch && e.touches.length > 1) return; // Más de un toque sin pinch
    
    e.preventDefault();
    isPinching = false;
    isResizing = false;
    resizeDirection = ''; // Limpiamos la dirección

    const eventClientX = isTouch ? e.touches[0].clientX : e.clientX;
    const eventClientY = isTouch ? e.touches[0].clientY : e.clientY;

    activeItem = windowElement;
    activeItem.classList.add('active-drag');

    elevateWindow(activeItem);

    const rect = activeItem.getBoundingClientRect();

    xOffset = eventClientX - rect.left;
    yOffset = eventClientY - rect.top;

    initialX = eventClientX;
    initialY = eventClientY;
}

/* ==================== INICIO DE REDIMENSIÓN (HANDLE - Mantenido) ==================== */

function resizeStart(e) {
    e.preventDefault();

    isResizing = true;
    isPinching = false;
    resizeDirection = 'handle'; // Dirección específica para el handle
    const isTouch = e.type.includes('touch');

    activeItem = this.closest('.window');
    activeItem.classList.add('active-resize');
    elevateWindow(activeItem);

    initialX = isTouch ? e.touches[0].clientX : e.clientX;
    initialY = isTouch ? e.touches[0].clientY : e.clientY;

    initialWidth = activeItem.offsetWidth;
    initialHeight = activeItem.offsetHeight;
    initialLeft = parseFloat(activeItem.style.left) || 0;
    initialTop = parseFloat(activeItem.style.top) || 0;

    initialRatio = parseFloat(activeItem.getAttribute('data-aspect-ratio')) || (initialWidth / (initialHeight - FOOTER_HEIGHT));
}


/* ==================== FUNCIÓN DE MOVIMIENTO (DRAG/RESIZE) ==================== */

function drag(e) {
    if (!activeItem) return;
    e.preventDefault();

    const isTouch = e.type.includes('touch');
    const eventClientX = isTouch ? (e.touches[0] ? e.touches[0].clientX : null) : e.clientX;
    const eventClientY = isTouch ? (e.touches[0] ? e.touches[0].clientY : null) : e.clientY;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const MIN_LEFT = BODY_MARGIN;
    const MIN_TOP = BODY_MARGIN;

    if (isResizing) {
        let newWidth, newBodyHeight, newLeft, newTop;
        newLeft = initialLeft;
        newTop = initialTop;

        if (isPinching && isTouch && e.touches.length === 2) {
            // --- MODO REDIMENSIÓN: PELLIZCO (PINCH-TO-ZOOM) - LIMPIO ---
            // ... (Lógica de Pinch-to-zoom - Mantenida igual) ...
            const currentDx = e.touches[0].clientX - e.touches[1].clientX;
            const currentDy = e.touches[0].clientY - e.touches[1].clientY;
            const currentDistance = Math.sqrt(currentDx * currentDx + currentDy * currentDy);
            
            const scaleFactor = currentDistance / initialDistance;

            newWidth = initialWidth * scaleFactor;
            newBodyHeight = (initialHeight - FOOTER_HEIGHT) * scaleFactor;

            const deltaWidth = newWidth - initialWidth;
            const deltaHeight = (newBodyHeight + FOOTER_HEIGHT) - initialHeight;

            newLeft = initialLeft - (deltaWidth / 2);
            newTop = initialTop - (deltaHeight / 2);
            
        } else if (eventClientX === null || eventClientY === null) {
            // No hay datos de cursor (puede ocurrir si un dedo se levanta durante el pinch)
            return;
            
        } else {
            // --- MODO REDIMENSIÓN: BORDE (Handle o Borde General) ---
            
            let deltaX = eventClientX - initialX;
            let deltaY = eventClientY - initialY;
            
            newWidth = initialWidth;
            newBodyHeight = initialHeight - FOOTER_HEIGHT;
            
            // Lógica de Redimensionamiento por Eje (aplicando la dirección capturada)
            
            // 1. Redimensionamiento Horizontal (Left/Right)
            if (resizeDirection.includes('left')) {
                newWidth = Math.max(initialWidth - deltaX, 150);
                newLeft = initialLeft + (initialWidth - newWidth); // Mueve la ventana
            } else if (resizeDirection.includes('right') || resizeDirection === 'handle') {
                newWidth = Math.max(initialWidth + deltaX, 150);
            }

            // 2. Redimensionamiento Vertical (Top/Bottom)
            if (resizeDirection.includes('top')) {
                let newHeight = Math.max(initialHeight - deltaY, 100);
                newBodyHeight = newHeight - FOOTER_HEIGHT;
                newTop = initialTop + (initialHeight - newHeight); // Mueve la ventana
            } else if (resizeDirection.includes('bottom') || resizeDirection === 'handle') {
                let newHeight = Math.max(initialHeight + deltaY, 100);
                newBodyHeight = newHeight - FOOTER_HEIGHT;
            }
            
            // 3. Mantener Proporción (Solo si se redimensiona por las esquinas y no es el handle)
            if (resizeDirection.includes('left') || resizeDirection.includes('top')) {
                 // Si se redimensiona por el borde IZQUIERDO o SUPERIOR, mantenemos la proporción
                 
                 let currentHeight = newBodyHeight + FOOTER_HEIGHT;
                 
                 // Priorizar el cambio más grande
                 const diffX = newWidth - initialWidth;
                 const diffY = currentHeight - initialHeight;
                 
                 if (Math.abs(diffX) > Math.abs(diffY)) {
                     // Guiar por el ancho (newWidth)
                     newBodyHeight = newWidth / initialRatio;
                 } else {
                     // Guiar por el alto (newBodyHeight)
                     newWidth = newBodyHeight * initialRatio;
                 }
                 
                 // Recalcular newLeft y newTop después del ajuste proporcional
                 const finalDeltaWidth = newWidth - initialWidth;
                 const finalDeltaHeight = (newBodyHeight + FOOTER_HEIGHT) - initialHeight;
                 
                 // Esto es un poco complejo ya que debe moverse en la dirección opuesta
                 if (resizeDirection.includes('left')) {
                     newLeft = initialLeft - finalDeltaWidth;
                 }
                 if (resizeDirection.includes('top')) {
                     newTop = initialTop - finalDeltaHeight;
                 }

            } else if (resizeDirection === 'handle') {
                 // Lógica original del handle (redimensionamiento proporcional por defecto)
                 if (Math.abs(deltaX) > Math.abs(deltaY)) {
                     newBodyHeight = newWidth / initialRatio;
                 } else {
                     newWidth = newBodyHeight * initialRatio;
                 }
            }
            
            // Asegurar un ancho/alto mínimo
            if (newWidth < 150) { newWidth = 150; }
            if (newBodyHeight < (100 - FOOTER_HEIGHT)) { newBodyHeight = 100 - FOOTER_HEIGHT; }
            
        } // Fin del bloque 'Borde' y 'Handle'
        
        // Si no se pudo calcular (p.ej., si isPinching se desactiva antes de dragEnd), salimos
        if (!newWidth || !newBodyHeight) return; 

        // --- LÓGICA DE APLICACIÓN DE TAMAÑO Y LÍMITES ---
        let newHeight = newBodyHeight + FOOTER_HEIGHT;

        if (newWidth >= 150 && newHeight >= 100) {
            
            // Aplicar límites de posición (no salirse por la izquierda/arriba)
            let finalLeft = Math.min(Math.max(newLeft, MIN_LEFT), viewportWidth - newWidth - BODY_MARGIN);
            let finalTop = Math.min(Math.max(newTop, MIN_TOP), viewportHeight - newHeight - BODY_MARGIN);
            
            // Aplicar límites de redimensionamiento (no salirse por la derecha/abajo)
            let maxPossibleWidth = viewportWidth - finalLeft - BODY_MARGIN;
            let maxPossibleHeight = viewportHeight - finalTop - BODY_MARGIN;

            // Limitamos ancho (siempre después de limitar la posición)
            newWidth = Math.min(newWidth, maxPossibleWidth);
            newHeight = Math.min(newHeight, maxPossibleHeight);
            
            // Reajuste final por la proporción si el límite cortó un eje
            if (newWidth / newBodyHeight !== initialRatio) {
                 newBodyHeight = newWidth / initialRatio;
                 newHeight = newBodyHeight + FOOTER_HEIGHT;
                 
                 if (newHeight > maxPossibleHeight) {
                    newHeight = maxPossibleHeight;
                    newBodyHeight = newHeight - FOOTER_HEIGHT;
                    newWidth = newBodyHeight * initialRatio;
                 }
            }
            
            // Recalcular finalLeft/finalTop para el redimensionamiento del borde Superior/Izquierdo
            if (resizeDirection.includes('left')) {
                finalLeft = initialLeft + (initialWidth - newWidth);
                finalLeft = Math.min(Math.max(finalLeft, MIN_LEFT), viewportWidth - newWidth - BODY_MARGIN);
            }
            if (resizeDirection.includes('top')) {
                finalTop = initialTop + (initialHeight - newHeight);
                finalTop = Math.min(Math.max(finalTop, MIN_TOP), viewportHeight - newHeight - BODY_MARGIN);
            }
            

            activeItem.style.width = newWidth + 'px';
            activeItem.style.height = newHeight + 'px';
            activeItem.style.left = finalLeft + 'px';
            activeItem.style.top = finalTop + 'px';

            updateDimensionsText(activeItem);
        }

    } else {
        // Modo Arrastre (DRAG)
        if (eventClientX === null || eventClientY === null) return; 
        
        currentX = eventClientX - xOffset;
        currentY = eventClientY - yOffset;

        const itemWidth = activeItem.offsetWidth;
        const itemHeight = activeItem.offsetHeight;

        const maxX = viewportWidth - itemWidth - BODY_MARGIN;
        const maxY = viewportHeight - itemHeight - BODY_MARGIN;

        currentX = Math.min(Math.max(currentX, MIN_LEFT), maxX);
        currentY = Math.min(Math.max(currentY, MIN_TOP), maxY);

        activeItem.style.left = currentX + 'px';
        activeItem.style.top = currentY + 'px';
    }
}


/* ==================== FUNCIÓN DE FINALIZACIÓN ==================== */

function dragEnd(e) {
    if (!activeItem) return;

    const isTouch = e.type.includes('touch');
    if (isPinching && isTouch && e.touches.length > 0) {
        return;
    }

    activeItem.classList.remove('active-drag', 'active-resize');
    updateDimensionsText(activeItem);

    activeItem = null;
    isResizing = false;
    isPinching = false;
    initialDistance = 0;
    resizeDirection = ''; // Limpiamos la dirección
}

// 1. Configuración de escuchadores de eventos
// (Mantenida igual)
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
// (Mantenida igual)
document.addEventListener('mouseup', dragEnd);
document.addEventListener('touchend', dragEnd);
document.addEventListener('mousemove', drag);
document.addEventListener('touchmove', drag);

// Al redimensionar la ventana del navegador, ajusta la posición de las ventanas abiertas.
// (Mantenida igual)
window.addEventListener('resize', () => {
    draggableElements.forEach(item => {
        randomizeWindowPosition(item);
    });
});

// Llamada inicial
// (Mantenida igual)
window.addEventListener('load', () => {
      draggableElements.forEach(item => initializeWindow(item));
});


// --- FUNCIONES DEL FORMULARIO DE CORREO ---
// (Mantenidas iguales)
window.handlePortfolioRequest = function() {
    const emailInput = document.getElementById('emailInput');
    const portfolioButton = document.getElementById('portfolioButton');
    const recipientEmail = "castilloferreroangela@gmail.com";
    
    if (emailInput.classList.contains('visible') && emailInput.value.length > 0) {
        const subject = "Solicitud de Portfolio Completo";
        const body = `Hola, me gustaría solicitar el portfolio completo. Mi correo es: ${emailInput.value}`;
        const mailtoLink = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoLink;
    } else {
        emailInput.classList.add('visible');
        emailInput.focus();
        checkEmailStatus();
    }
}

window.checkEmailStatus = function() {
    const emailInput = document.getElementById('emailInput');
    const portfolioButton = document.getElementById('portfolioButton');
    const emailPattern = /\S+@\S+\.(com|net|org|es|gov|edu|io|co|info|biz)/i;

    if (emailInput.classList.contains('visible') && emailPattern.test(emailInput.value)) {
        portfolioButton.textContent = "send!";
    } else {
        portfolioButton.textContent = "request full portfolio";
    }
}
let initialDistance = 0; // Distancia inicial entre los dos dedos para redimensionar
let highestZIndex = 100;

// Nuevas variables para un redimensionamiento por pellizco limpio
let initialLeft, initialTop; 

const FOOTER_HEIGHT = 35; 
const BODY_MARGIN = 15; // El margen del body definido en CSS

// ======================================================================
// FUNCIÓN PARA CALCULAR LA POSICIÓN INICIAL (AJUSTADA AL CENTRO DEL ABOUT ME)
// ======================================================================
function randomizeWindowPosition(windowElement) {
    const aboutContainer = document.querySelector('.about-container');

    if (!aboutContainer) return;

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
    const randomOffsetX = Math.random() * scatterRange - (scatterRange / 3);
    const randomOffsetY = Math.random() * scatterRange - (scatterRange / 3);

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
    const MIN_WIDTH = 200;
    const MAX_WIDTH = 400;

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
    // Si ya estamos redimensionando con el handle, no hacemos nada
    if (e.target.classList.contains('resize-handle')) {
        return;
    }
    
    // Ignorar clic en controles interactivos
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.tagName === 'INPUT') {
        return;
    }

    const isTouch = e.type.includes('touch');

    if (isTouch && e.touches.length === 2) {
        // --- INICIO DE PELLIZCO (PINCH-TO-ZOOM) ---
        e.preventDefault();
        
        activeItem = this; 
        elevateWindow(activeItem);
        
        isPinching = true;
        isResizing = true; 
        activeItem.classList.add('active-resize');

        // 1. Calcular la distancia inicial entre los dos dedos
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialDistance = Math.sqrt(dx * dx + dy * dy);

        // 2. Guardar dimensiones y posición inicial
        initialWidth = activeItem.offsetWidth;
        initialHeight = activeItem.offsetHeight;
        initialLeft = parseFloat(activeItem.style.left) || 0;
        initialTop = parseFloat(activeItem.style.top) || 0;
        initialRatio = parseFloat(activeItem.getAttribute('data-aspect-ratio')) || (initialWidth / (initialHeight - FOOTER_HEIGHT));

        return; 
    }
    
    // --- INICIO DE ARRASTRE (DRAG) ---
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
    isPinching = false;
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
    const eventClientX = isTouch ? (e.touches[0] ? e.touches[0].clientX : null) : e.clientX;
    const eventClientY = isTouch ? (e.touches[0] ? e.touches[0].clientY : null) : e.clientY;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const MIN_LEFT = BODY_MARGIN;
    const MIN_TOP = BODY_MARGIN;

    if (isResizing) {
        let newWidth, newBodyHeight, newLeft, newTop;

        if (isPinching && isTouch && e.touches.length === 2) {
            // --- MODO REDIMENSIÓN: PELLIZCO (PINCH-TO-ZOOM) - LIMPIO ---
            const currentDx = e.touches[0].clientX - e.touches[1].clientX;
            const currentDy = e.touches[0].clientY - e.touches[1].clientY;
            const currentDistance = Math.sqrt(currentDx * currentDx + currentDy * currentDy);
            
            const scaleFactor = currentDistance / initialDistance;

            newWidth = initialWidth * scaleFactor;
            newBodyHeight = (initialHeight - FOOTER_HEIGHT) * scaleFactor;

            // Para redimensionar desde el centro, calculamos cuánto ha cambiado
            // y aplicamos la mitad de ese cambio como desplazamiento (left/top).
            const deltaWidth = newWidth - initialWidth;
            const deltaHeight = (newBodyHeight + FOOTER_HEIGHT) - initialHeight;

            newLeft = initialLeft - (deltaWidth / 2);
            newTop = initialTop - (deltaHeight / 2);

        } else if (!isPinching) {
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
                    newBodyHeight = 100 - FOOTER_HEIGHT;
                    newWidth = newBodyHeight * initialRatio;
                }
            }
            newLeft = parseFloat(activeItem.style.left) || 0; // Se mantiene la posición
            newTop = parseFloat(activeItem.style.top) || 0; // Se mantiene la posición
        }
        
        // Si no se pudo calcular (p.ej., si isPinching se desactiva antes de dragEnd), salimos
        if (!newWidth || !newBodyHeight) return; 

        // --- LÓGICA DE APLICACIÓN DE TAMAÑO Y LÍMITES (Común a Handle y Pinch) ---
        let newHeight = newBodyHeight + FOOTER_HEIGHT;

        if (newWidth >= 150 && newHeight >= 100) {
            
            // 1. Aplicar límites de redimensionamiento (no salirse por la derecha/abajo)
            let maxPossibleWidth = viewportWidth - newLeft - BODY_MARGIN;
            let maxPossibleHeight = viewportHeight - newTop - BODY_MARGIN;

            // Limitamos ancho
            if (newWidth > maxPossibleWidth) {
                 newWidth = maxPossibleWidth;
                 newBodyHeight = newWidth / initialRatio;
                 newHeight = newBodyHeight + FOOTER_HEIGHT;
            }
            // Limitamos alto (ajustando de nuevo el ancho por proporción)
            if (newHeight > maxPossibleHeight) {
                 newHeight = maxPossibleHeight;
                 newBodyHeight = newHeight - FOOTER_HEIGHT;
                 newWidth = newBodyHeight * initialRatio;
            }
            
            // 2. Aplicar límites de posición (no salirse por la izquierda/arriba)
            let finalLeft = Math.min(Math.max(newLeft, MIN_LEFT), viewportWidth - newWidth - BODY_MARGIN);
            let finalTop = Math.min(Math.max(newTop, MIN_TOP), viewportHeight - newHeight - BODY_MARGIN);
            
            // Si la posición se ha ajustado debido a los límites, recalcular el ancho y alto
            // para asegurar que no se salen de los bordes.
            if (isPinching && (finalLeft !== newLeft || finalTop !== newTop)) {
                // Si la posición se mueve, el centro de redimensionamiento se arruina
                // En este caso, simplemente aplicamos la nueva posición y el tamaño actual.
            }

            activeItem.style.width = newWidth + 'px';
            activeItem.style.height = newHeight + 'px';
            activeItem.style.left = finalLeft + 'px';
            activeItem.style.top = finalTop + 'px';

            updateDimensionsText(activeItem);
        }

    } else {
        // Modo Arrastre
        if (eventClientX === null || eventClientY === null) return; 
        
        currentX = eventClientX - xOffset;
        currentY = eventClientY - yOffset;

        const itemWidth = activeItem.offsetWidth;
        const itemHeight = activeItem.offsetHeight;

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
    isPinching = false;
    initialDistance = 0;
}

// Llamada inicial para asegurar que todas las imágenes se inicialicen
window.addEventListener('load', () => {
      draggableElements.forEach(item => initializeWindow(item));
});

// Al redimensionar la ventana del navegador, ajusta la posición de las ventanas abiertas.
window.addEventListener('resize', () => {
    draggableElements.forEach(item => {
        randomizeWindowPosition(item);
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
        emailInput.focus();
        
        // Comprueba si ya está listo para "send!"
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
