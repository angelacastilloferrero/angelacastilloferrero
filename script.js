(function() {
    'use strict';
    
    // ==================== DECLARACIÓN DE VARIABLES ====================
    
    const draggableElements = document.querySelectorAll('.window');

    let activeItem = null; // La ventana que se está arrastrando o redimensionando
    let isResizing = false;
    let isPinching = false; 

    let currentX, currentY;
    let initialX, initialY;
    let xOffset, yOffset;

    let initialWidth, initialHeight;
    let initialRatio;
    let initialDistance = 0; 
    let highestZIndex = 100;

    let initialLeft, initialTop; 
    
    let resizeDirection = ''; // Almacena la dirección de redimensionamiento (e.g., 'right', 'bottom', 'top-left', 'handle')
    
    // CONSTANTES
    const RESIZE_AREA = 8; // Área de 8px alrededor del borde para activar el resize
    const MIN_WIDTH = 150;
    const MIN_HEIGHT = 100; 
    const FOOTER_HEIGHT = 35; 
    const BODY_MARGIN = 15; 

    // ======================================================================
    // FUNCIONES DE UTILIDAD
    // ======================================================================
    
    function elevateWindow(clickedWindow) {
        highestZIndex++;
        clickedWindow.style.zIndex = highestZIndex;
    }

    function updateDimensionsText(windowElement) {
        const currentWidth = Math.round(windowElement.offsetWidth);
        const currentBodyHeight = Math.round(windowElement.offsetHeight - FOOTER_HEIGHT);

        const dimensionsSpan = windowElement.querySelector('.dimensions-text');
        if (dimensionsSpan) {
            dimensionsSpan.textContent = `(${currentWidth}x${currentBodyHeight})`;
        }
    }
    
    // Función para detectar si el cursor está en el borde de la ventana
    function checkResizeBorders(e, windowElement) {
        if (e.type.includes('touch')) return '';
        
        const rect = windowElement.getBoundingClientRect();
        const clientX = e.clientX;
        const clientY = e.clientY;
        
        let direction = '';

        const isTop = clientY < rect.top + RESIZE_AREA;
        const isBottom = clientY > rect.bottom - RESIZE_AREA;
        const isLeft = clientX < rect.left + RESIZE_AREA;
        const isRight = clientX > rect.right - RESIZE_AREA;
        
        // Esquinas
        if (isTop && isLeft) direction = 'top-left';
        else if (isTop && isRight) direction = 'top-right';
        else if (isBottom && isLeft) direction = 'bottom-left';
        else if (isBottom && isRight) direction = 'bottom-right';

        // Bordes
        else if (isTop) direction = 'top';
        else if (isBottom) direction = 'bottom';
        else if (isLeft) direction = 'left';
        else if (isRight) direction = 'right';

        return direction;
    }

    // ======================================================================
    // FUNCIONES DE INICIALIZACIÓN
    // ======================================================================
    
    function randomizeWindowPosition(windowElement) {
        const aboutContainer = document.querySelector('.about-container');

        if (!aboutContainer) return;

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const elementWidth = windowElement.offsetWidth;
        const elementHeight = windowElement.offsetHeight;

        const aboutRect = aboutContainer.getBoundingClientRect();
        const aboutCenterX = aboutRect.left + (aboutRect.width / 2);
        const aboutCenterY = aboutRect.top + (aboutRect.height / 2);

        let baseX = aboutCenterX - (elementWidth / 2);
        let baseY = aboutCenterY - (elementHeight / 2);

        const scatterRange = 600; 
        const randomOffsetX = Math.random() * scatterRange - (scatterRange / 3);
        const randomOffsetY = Math.random() * scatterRange - (scatterRange / 3);

        let targetX = baseX + randomOffsetX;
        let targetY = baseY + randomOffsetY;

        const MIN_LEFT = BODY_MARGIN;
        const MIN_TOP = BODY_MARGIN;
        const MAX_LEFT = viewportWidth - elementWidth - BODY_MARGIN;
        const MAX_TOP = viewportHeight - elementHeight - BODY_MARGIN;
        
        targetX = Math.min(Math.max(targetX, MIN_LEFT), MAX_LEFT);
        targetY = Math.min(Math.max(targetY, MIN_TOP), MAX_TOP);
        
        windowElement.style.top = targetY + 'px';
        windowElement.style.left = targetX + 'px';
    }

    function setInitialDimensions(windowElement, img) {
        const INIT_MIN_WIDTH = 200;
        const INIT_MAX_WIDTH = 400;

        const randomWidth = Math.random() * (INIT_MAX_WIDTH - INIT_MIN_WIDTH) + INIT_MIN_WIDTH;

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


    /* ==================== EVENT HANDLERS (START) ==================== */

    function startInteraction(e) {
        const windowElement = this;
        const isTouch = e.type.includes('touch');
        const isLeftClick = e.button === 0;

        // 1. Manejo de Pellizco (Touch)
        if (isTouch && e.touches.length === 2) {
            e.preventDefault();
            activeItem = windowElement; 
            elevateWindow(activeItem);
            isPinching = true;
            isResizing = true; 
            resizeDirection = 'pinch'; 
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
        
        // 2. Comprobación de Controles Interactivos o Handle
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.tagName === 'INPUT' || e.target.classList.contains('resize-handle')) {
            return;
        }

        // 3. Comprobación de Borde (Solo para Desktop)
        if (!isTouch && isLeftClick) {
            const direction = checkResizeBorders(e, windowElement);
            
            if (direction !== '') {
                e.preventDefault();
                isResizing = true;
                isPinching = false;
                resizeDirection = direction; 
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
                return; 
            }
        }
        
        // 4. Inicio de Arrastre (Drag)
        if (isTouch && e.touches.length > 1) return; 
        
        e.preventDefault();
        isPinching = false;
        isResizing = false;
        resizeDirection = ''; 

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

    function resizeStart(e) {
        e.preventDefault();

        isResizing = true;
        isPinching = false;
        resizeDirection = 'handle'; // Handle inferior derecho
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


/* ==================== EVENT HANDLER (DRAG/RESIZE) ==================== */

function drag(e) {
    if (!activeItem) {
        // Lógica de cursor para Desktop cuando no estamos arrastrando
        if (e.type === 'mousemove' && !e.target.closest('.window')) {
            document.body.style.cursor = 'default';
        }
        return;
    }
    
    e.preventDefault();

    const isTouch = e.type.includes('touch');
    const eventClientX = isTouch ? (e.touches[0] ? e.touches[0].clientX : null) : e.clientX;
    const eventClientY = isTouch ? (e.touches[0] ? e.touches[0].clientY : null) : e.clientY;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const MIN_LEFT = BODY_MARGIN;
    const MIN_TOP = BODY_MARGIN;
    
    // Nueva declaración al inicio para evitar el ReferenceError
    let isSideOnly = false; 

    if (isResizing) {
        let newWidth, newBodyHeight, newLeft, newTop;
        newLeft = initialLeft;
        newTop = initialTop;

        if (isPinching && isTouch && e.touches.length === 2) {
            // --- MODO REDIMENSIÓN: PELLIZCO ---
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
            return;
            
        } else {
            // --- MODO REDIMENSIÓN: BORDE/HANDLE ---
            
            let deltaX = eventClientX - initialX;
            let deltaY = eventClientY - initialY;
            
            newWidth = initialWidth;
            newBodyHeight = initialHeight - FOOTER_HEIGHT;
            
            // Ajustar Posición y Tamaño base según la Dirección (Resize por Borde/Esquina)
            if (resizeDirection.includes('left')) {
                newWidth = Math.max(initialWidth - deltaX, MIN_WIDTH);
                newLeft = initialLeft + (initialWidth - newWidth);
            } else if (resizeDirection.includes('right') || resizeDirection === 'handle') {
                newWidth = Math.max(initialWidth + deltaX, MIN_WIDTH);
            }

            if (resizeDirection.includes('top')) {
                let newHeight = Math.max(initialHeight - deltaY, MIN_HEIGHT);
                newBodyHeight = newHeight - FOOTER_HEIGHT;
                newTop = initialTop + (initialHeight - newHeight);
            } else if (resizeDirection.includes('bottom') || resizeDirection === 'handle' || resizeDirection === 'bottom-right') {
                let newHeight = Math.max(initialHeight + deltaY, MIN_HEIGHT);
                newBodyHeight = newHeight - FOOTER_HEIGHT;
            }
            
            // Re-asignación de isSideOnly DENTRO de este bloque 'else'
            isSideOnly = ['top', 'bottom', 'left', 'right'].includes(resizeDirection);
            
            if (!isSideOnly && initialRatio) {
                // Guiar por el eje que más se ha movido para calcular la nueva dimensión proporcional
                let currentHeight = newBodyHeight + FOOTER_HEIGHT;
                
                if (Math.abs(newWidth - initialWidth) > Math.abs(currentHeight - initialHeight)) {
                    newBodyHeight = newWidth / initialRatio;
                } else {
                    newWidth = newBodyHeight * initialRatio;
                }
                
                // Recalcular newLeft y newTop después del ajuste proporcional (solo si es borde superior/izquierdo)
                if (resizeDirection.includes('left')) {
                    newLeft = initialLeft + (initialWidth - newWidth);
                }
                if (resizeDirection.includes('top')) {
                    newTop = initialTop + (initialHeight - (newBodyHeight + FOOTER_HEIGHT));
                }
            }
            
            // Asegurar un ancho/alto mínimo
            newWidth = Math.max(newWidth, MIN_WIDTH);
            newBodyHeight = Math.max(newBodyHeight, MIN_HEIGHT - FOOTER_HEIGHT);
        } 
        
        if (!newWidth || !newBodyHeight) return; 

        // --- LÍMITES Y APLICACIÓN FINAL ---
        let newHeight = newBodyHeight + FOOTER_HEIGHT;

        if (newWidth >= MIN_WIDTH && newHeight >= MIN_HEIGHT) {
            
            // 1. Limitar posición (para que la ventana no se salga por la izquierda/arriba)
            let finalLeft = Math.min(Math.max(newLeft, MIN_LEFT), viewportWidth - newWidth - BODY_MARGIN);
            let finalTop = Math.min(Math.max(newTop, MIN_TOP), viewportHeight - newHeight - BODY_MARGIN);
            
            // 2. Limitar tamaño (para que no se salga por la derecha/abajo)
            let maxPossibleWidth = viewportWidth - finalLeft - BODY_MARGIN;
            let maxPossibleHeight = viewportHeight - finalTop - BODY_MARGIN;

            newWidth = Math.min(newWidth, maxPossibleWidth);
            newHeight = Math.min(newHeight, maxPossibleHeight);
            
            // 3. Reajuste de proporción si el límite cortó un eje
            if (!isSideOnly && initialRatio) { // isSideOnly siempre estará definida aquí
                newBodyHeight = newWidth / initialRatio;
                newHeight = newBodyHeight + FOOTER_HEIGHT;
                
                if (newHeight > maxPossibleHeight) {
                    newHeight = maxPossibleHeight;
                    newBodyHeight = newHeight - FOOTER_HEIGHT;
                    newWidth = newBodyHeight * initialRatio;
                }
            }
            
            // 4. Aplicar
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

        currentX = Math.min(Math.max(currentX, MIN_LEFT), maxX);
        currentY = Math.min(Math.max(currentY, MIN_TOP), maxY);

        activeItem.style.left = currentX + 'px';
        activeItem.style.top = currentY + 'px';
    }
}


    /* ==================== EVENT HANDLER (END) ==================== */

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
        resizeDirection = ''; 
    }
    
    // ==================== LÓGICA DE CURSOR (UX) ====================
    
    function updateCursor(e) {
        // Solo para ratón y si no estamos arrastrando/redimensionando
        if (activeItem || e.type !== 'mousemove') return; 

        const windowElement = e.target.closest('.window');
        
        if (windowElement) {
            const direction = checkResizeBorders(e, windowElement);
            let cursor = 'default';
            
            // Asigna el cursor basado en la dirección de redimensionamiento
            switch (direction) {
                case 'top':
                case 'bottom':
                    cursor = 'ns-resize';
                    break;
                case 'left':
                case 'right':
                    cursor = 'ew-resize';
                    break;
                case 'top-left':
                case 'bottom-right':
                case 'handle':
                    cursor = 'nwse-resize';
                    break;
                case 'top-right':
                case 'bottom-left':
                    cursor = 'nesw-resize';
                    break;
                default:
                    // Si no estamos en el borde, verificamos si es arrastrable (Header)
                    if (e.target.closest('.window-header')) {
                         cursor = 'grab';
                    } else {
                         cursor = 'default';
                    }
                    break;
            }
            windowElement.style.cursor = cursor;
        } else {
            document.body.style.cursor = 'default';
        }
    }

    // ==================== INICIALIZACIÓN DE EVENT LISTENERS ====================
    
    draggableElements.forEach(item => {
        const resizeHandle = item.querySelector('.resize-handle');

        initializeWindow(item);

        // Eventos de inicio de interacción (Arrastre/Borde)
        item.addEventListener('mousedown', startInteraction);
        item.addEventListener('touchstart', startInteraction);
        
        // Evento para cambiar el cursor al pasar por los bordes (solo Desktop)
        item.addEventListener('mousemove', updateCursor);

        // Eventos específicos del handle
        if (resizeHandle) {
            resizeHandle.addEventListener('mousedown', resizeStart);
            resizeHandle.addEventListener('touchstart', resizeStart);
        }
    });

    // Eventos globales en el documento (Arresto de la acción)
    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('touchend', dragEnd);
    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag);
    
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


    // --- FUNCIONES DEL FORMULARIO DE CORREO (Adjuntas a window para acceso HTML) ---

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
            window.checkEmailStatus();
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

})(); // Fin de la IIFE: garantiza que todo el código se ejecuta en su propio ámbito.
