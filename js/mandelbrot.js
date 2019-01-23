"use strict";

var mandelbrotCanvas = document.getElementById("mandelbrotCanvas");
var mandelbrotContext = mandelbrotCanvas.getContext("2d");
var width = mandelbrotCanvas.width;
var height = mandelbrotCanvas.height;
mandelbrotContext.font = "bold 10pt Raleway";

// For zooming with the mouse:
mandelbrotCanvas.addEventListener("mousedown", mandelbrotMouseDown, false);
mandelbrotCanvas.addEventListener("mouseup", mandelbrotMouseUp, false);
mandelbrotCanvas.addEventListener("mousemove", mandelbrotMouseMove, false);
var ul = {x: 0, y: 0}; // coordinates of boundary box when zooming
var lr = {x: 0, y: 0}; //  ...
var drag = false;

// These are the boundaries for c=x+iy on the complex plane:
var xmax = 1.1;
var xmin = -2.1;
var ymax = 1.6;
var ymin = -1.6;

// Maximum number of iterations of z=z^2+c to test:
var maxIters = document.getElementById("iterations").value;

var max = 0;
var min = Number.MAX_SAFE_INTEGER;

var imageData = mandelbrotContext.createImageData(width, height);
var intensities = new Array(width * height);


/* Draw once on load: */
calculateMandelbrot();
drawMandelbrot();

function recalculate() {
    mandelbrotContext.fillText("Recalculating...", 10, 14);
    /* use setTimeout to ensure that we update the canvas
     * before the call to calculateMandelbrot()
     */
    setTimeout( function() {calculateMandelbrot(); drawMandelbrot();}, 10);
}

/* Redraw the Mandelbrot set on the canvas.
 * Set must be calculated first with calculateMandelbrot()
 */
function drawMandelbrot()
{
    let colour = document.getElementById("colour").checked;
    mandelbrotContext.clearRect(0, 0, width, height);
    var i, j, x, y;
    var index, img_index, intensity;
    console.log(max, min);
    for(i = 0; i < width; i++) {
        for(j = 0; j < height; j++){
            index = (i + j * width);
            img_index = index * 4;
            intensity = intensities[index];
            if (intensity == 0) {
                imageData.data[img_index] = 0;
                imageData.data[img_index + 1] = 0;
                imageData.data[img_index + 2] = 0;
                imageData.data[img_index + 3] = 255;
            } else if(colour){
                intensity -= min;
                intensity /= (max - min) ;
                let rgb = HSVtoRGB((280 + 360 * intensity) % 360, 1, 1);
                imageData.data[img_index] =  255 * rgb.r;
                imageData.data[img_index + 1] = 255 * rgb.g;
                imageData.data[img_index + 2] = 255 * rgb.b;
                imageData.data[img_index + 3] = 255;
            } else {
                imageData.data[img_index] = 255;
                imageData.data[img_index + 1] = 255;
                imageData.data[img_index + 2] = 255;
                imageData.data[img_index + 3] = 255;
            }
        }
    }
    mandelbrotContext.putImageData(imageData, 0, 0);
    drawAxes();
}

/* Calculate pixel values for each pixel on the canvas within the current
 * boundaries for c: xmin, xmax, ymin, ymax.
 */
function calculateMandelbrot()
{
    maxIters = document.getElementById("iterations").value;
    var x,y,i,j;
    var intensity, img_index, index;
    max =0;
    min = Number.MAX_SAFE_INTEGER;
    for(i = 0; i < width; i++) {
        for(j = 0; j < height; j++){
            x = xmin + (xmax - xmin) * (i / width);
            y = ymin + (ymax - ymin) * (j / height);
            y = ymax - (ymax - ymin) * (j / height);
            intensity = iterate(x, y, maxIters);
            if (intensity > max) max = intensity;
            if (intensity != 0 && intensity < min) min = intensity;
            index = (i + j * width);
            intensities[index] = intensity;
        }
    }
}


/* Draw axes of the complex plane on the image.
*/
function drawAxes()
{
    let axes = document.getElementById("axes").checked;
    let colour = document.getElementById("colour").checked;
    if(axes) {
        if(colour){
            mandelbrotContext.lineWidth = 2;
            mandelbrotContext.strokeStyle = "#ffffff";
            mandelbrotContext.fillStyle = "#ffffff";
        } else {
            mandelbrotContext.lineWidth = 2;
            mandelbrotContext.strokeStyle = "#777777";
            mandelbrotContext.fillStyle = "#777777";
        }
        /* If the current x-boundaries contain x=0
         * we can draw the y (imaginary) axis through
         * this point.
         */
        if (ymin < 0 && ymax > 0 && xmin < 0 && xmax > 0) {
            /* Imaginary axis
             */
            let x0 = width * (-xmin) / (xmax - xmin); 
            mandelbrotContext.beginPath();
            mandelbrotContext.moveTo(x0, 0);
            mandelbrotContext.lineTo(x0, height);
            mandelbrotContext.stroke();
            mandelbrotContext.closePath();
            mandelbrotContext.fillText("Im[c]", x0 - mandelbrotContext.measureText("Im[c]").width - 3, 15);
            /* Draw ticks at y = -1, +1 if these points are within view.
             */
            if (ymin < -1 && ymax > -1) {
                let y1 = height - height * (-ymin - 1) / (ymax-ymin)
                mandelbrotContext.beginPath();
                mandelbrotContext.moveTo(x0-5, y1);
                mandelbrotContext.lineTo(x0+5, y1);
                mandelbrotContext.stroke();
                mandelbrotContext.closePath();
                mandelbrotContext.fillText("-1", x0+10, y1+5);
            }
            if (ymin < 1 && ymax > 1) {
                let y1 = height - height * (-ymin +1 ) / (ymax - ymin);
                mandelbrotContext.beginPath();
                mandelbrotContext.moveTo(x0-5, y1);
                mandelbrotContext.lineTo(x0+5, y1);
                mandelbrotContext.stroke();
                mandelbrotContext.closePath();
                mandelbrotContext.fillText("1", x0+10, y1+5);
            }
            /* Real axis
             */
            let y0 = height - height * (-ymin) / (ymax - ymin); 
            mandelbrotContext.beginPath();
            mandelbrotContext.moveTo(0, y0);
            mandelbrotContext.lineTo(width, y0);
            mandelbrotContext.stroke();
            mandelbrotContext.closePath();
            /* Draw ticks at x = -2, -1, +1 if these points are within view.
             */
            if (xmin < -1 && xmax > -1) {
                let x1 = width * (-xmin - 1) / (xmax-xmin)
                mandelbrotContext.beginPath();
                mandelbrotContext.moveTo(x1, y0 - 5);
                mandelbrotContext.lineTo(x1, y0 + 5);
                mandelbrotContext.stroke();
                mandelbrotContext.closePath();
                mandelbrotContext.fillText("-1", x1 - 5, y0 + 15);
            }
            if (xmin < -2 && xmax > -2) {
                let x2 = width * (-xmin - 2) / (xmax-xmin)
                mandelbrotContext.beginPath();
                mandelbrotContext.moveTo(x2, y0 - 5);
                mandelbrotContext.lineTo(x2, y0 + 5);
                mandelbrotContext.stroke();
                mandelbrotContext.closePath();
                mandelbrotContext.fillText("-2", x2 - 5, y0 + 15);
            }
            if (xmin < 1 && xmax > 1) {
                let x1 = width * (-xmin +1 ) / (xmax - xmin);
                mandelbrotContext.beginPath();
                mandelbrotContext.beginPath();
                mandelbrotContext.moveTo(x1, y0 - 5);
                mandelbrotContext.lineTo(x1, y0 + 5);
                mandelbrotContext.stroke();
                mandelbrotContext.closePath();
                mandelbrotContext.fillText("1", x1, y0 + 15);
            }
            mandelbrotContext.fillText("Re[c]", width - mandelbrotContext.measureText("Re[c]").width - 3, y0 - 10);
        } else {
            /* If we can't see the origin, draw the axes at the edges of the
             * canvas.
             */
            /* Imaginary axis
            */
            let low = ymin + 0.1 * (ymax - ymin);
            let high = ymax - 0.1 * (ymax - ymin);
            let screenLow = height - 0.1 * height;
            let screenHigh = 0.1 * height;
            mandelbrotContext.beginPath();
            mandelbrotContext.moveTo(width - 15, screenLow);
            mandelbrotContext.lineTo(width - 5, screenLow);
            mandelbrotContext.lineTo(width - 5, screenHigh);
            mandelbrotContext.lineTo(width - 15, screenHigh);
            if (ymin < 0 && ymax > 0) {
                let y0 = height - height * (-ymin) / (ymax - ymin); 
                mandelbrotContext.moveTo(width - 15, y0);
                mandelbrotContext.lineTo(width - 5, y0);
                mandelbrotContext.fillText("0", width - 25, y0 + 3);
            }
            mandelbrotContext.stroke();
            mandelbrotContext.fillText(low.toFixed(4),
                    width - 18 - mandelbrotContext.measureText(low.toFixed(4)).width,
                    screenLow + 3);
            mandelbrotContext.fillText(high.toFixed(4),
                    width - 18 - mandelbrotContext.measureText(high.toFixed(4)).width,
                    screenHigh + 3);
            mandelbrotContext.fillText("Im[c]", width - mandelbrotContext.measureText("Im[c]").width - 3, screenHigh - 10);

            /* Real axis
             */
            low = xmin + 0.1 * (xmax - xmin);
            high = xmax - 0.1 * (xmax - xmin);
            screenLow = 0.1 * width;
            screenHigh = 0.9 * width;
            mandelbrotContext.beginPath();
            mandelbrotContext.moveTo(screenLow, height - 15);
            mandelbrotContext.lineTo(screenLow, height - 5);
            mandelbrotContext.lineTo(screenHigh, height - 5);
            mandelbrotContext.lineTo(screenHigh, height - 15);
            if (xmin < 0 && xmax > 0) {
                let x0 = width * (-xmin) / (xmax - xmin); 
                mandelbrotContext.moveTo(x0, height - 15);
                mandelbrotContext.lineTo(x0, height - 5);
                mandelbrotContext.fillText("0", x0 - 3, height - 17);
            }
            mandelbrotContext.stroke();
            mandelbrotContext.fillText(low.toFixed(4), screenLow - 20, height - 20);
            mandelbrotContext.fillText(high.toFixed(4), screenHigh - 20, height - 20);
            mandelbrotContext.fillText("Re[c]", screenHigh + 10, height - 7);
        }
    }
}


/*
 * Shrink area of complex plane we're plotting on.
 */
function zoomIn()
{
    let xrange = xmax - xmin;
    let yrange = ymax - ymin;
    xmax -= 0.1 * xrange;
    ymax -= 0.1 * yrange;
    xmin += 0.1 * xrange;
    ymin += 0.1 * yrange;
    recalculate();

}

/*
 * Increase area of complex plane we're plotting on.
 */
function zoomOut()
{
    let xrange = xmax - xmin;
    let yrange = ymax - ymin;
    xmax += 0.1 * xrange;
    ymax += 0.1 * yrange;
    xmin -= 0.1 * xrange;
    ymin -= 0.1 * yrange;
    recalculate();

}

/* Find points in the Mandelbrot Set.
 *
 * iterate z = z*z + c 
 * where z0 = 0+0i
 *        c = a+bi
 *
 * If we reach maxIters iterations and |z| <= sqrt(5), return 0   [a+ib in the set]
 * Otherwise, return a hue in the interval (0-1) that we can use to colour 
 * points not in the set. This is based on the number of iterations it takes
 * until |z| >= sqrt(5)
 * 
 */
function iterate(a, b, maxIters)
{
    let z = {a: 0, b: 0}
    var i;
    for(i=1; i <= maxIters; i++) {
        let x = z.a * z.a - z.b * z.b;
        let y = 2 * z.a * z.b;
        x += a;
        y += b;
        z = {a: x, b: y};
        if ((x*x + y*y) > 5) {
            let zabs = Math.sqrt(x*x + y*y);
            return (i + 1 -
                Math.log(zabs) / Math.sqrt(2)
            ) / maxIters;
        }
    }
    return 0;
}

/* When we click on the canvas, start dragging out a new boundary box
 * for the image.
 */
function mandelbrotMouseDown(event) {
    if(event.which != 1) return; 
    drag = true
    let mouseX = event.offsetX;
    let mouseY = event.offsetY;
    ul = {x:mouseX, y:mouseY}
    lr = {x:mouseX, y:mouseY}
    drawRectangle();
}

/* While we're selecting a new boundary box for the image,
 * redraw the box whenever we move the mouse
 */
function mandelbrotMouseMove(event) {
    if (drag) {
        let mouseX = event.offsetX;
        let mouseY = event.offsetY;
        lr = {x:mouseX, y:mouseY}
        drawRectangle();
    }
}

/* Zoom-in on mouse up:
 * When we've finished dragging out a new boundary for the image,
 * update xmin, xmax, ymin, ymax and redraw the image with the
 * new boundary.
 */
function mandelbrotMouseUp(event) {
    if(event.which != 1) return; 
    drag = false;
    let new_xmin = xmin + (ul.x / width) * (xmax - xmin);
    let new_xmax = xmin + (lr.x / width) * (xmax - xmin);
    let new_ymin = ymin + ((height - lr.y) / height) * (ymax - ymin);
    let new_ymax = ymin +  ((height - ul.y) / height) * (ymax - ymin);
    xmax = new_xmax;
    xmin = new_xmin;
    ymax = new_ymax;
    ymin = new_ymin;
    if (ymin > ymax) [ymin, ymax] = [ymax, ymin];
    if (xmin > xmax) [xmin, xmax] = [xmax, xmin];
    recalculate();
}

/* Draw a rectangle on the canvas when we click-and-drag a new boundary
 * box for the image
 */
function drawRectangle() {
    let colour = document.getElementById("colour").checked;
    if(colour){
        mandelbrotContext.lineWidth = 2;
        mandelbrotContext.strokeStyle = "#ffffff";
        mandelbrotContext.fillStyle = "#ffffff";
    } else {
        mandelbrotContext.lineWidth = 2;
        mandelbrotContext.strokeStyle = "#777777";
        mandelbrotContext.fillStyle = "#777777";
    }
    drawMandelbrot();
    mandelbrotContext.beginPath();
    mandelbrotContext.rect(ul.x, ul.y, lr.x - ul.x, - ul.y + lr.y);
    mandelbrotContext.closePath();
    mandelbrotContext.stroke();
    // Draw values of c at corners of box:
    let new_xmin = xmin + (ul.x / width) * (xmax - xmin);
    let new_xmax = xmin + (lr.x / width) * (xmax - xmin);
    let new_ymin = ymin + ((height- lr.y) / height) * (ymax - ymin);
    let new_ymax = ymin +  ((height - ul.y) / height) * (ymax - ymin);
    let lroffset = {x: 0, y:0};
    let uloffset = {x: 0, y:0};

    if(ul.x > lr.x) {
        lroffset.x = 0;
        uloffset.x = -80;
    } else {
        lroffset.x = -80;
        uloffset.x =  0;
    }

    if(ul.y > lr.y) {
        lroffset.y = -5;
        uloffset.y = 10;
    } else {
        lroffset.y = 10;
        uloffset.y = -5;
    }
    mandelbrotContext.fillText(new_xmin.toFixed(4)  +
        (Math.sign(new_ymax) >= 0? "+" : "") +
        new_ymax.toFixed(4) + "i",
        ul.x + uloffset.x, ul.y + uloffset.y);
    mandelbrotContext.fillText(new_xmax.toFixed(4)  +
        (Math.sign(new_ymin) >= 0? "+" : "") +
        new_ymin.toFixed(4) + "i",
        lr.x + lroffset.x, lr.y + lroffset.y);
}

/* Reset the view to the original boundary.
*/
function reset() 
{
    xmax = 1.1;
    xmin = -2.1;
    ymax = 1.6;
    ymin = -1.6;
    recalculate();
}

/* Convert HSV colour to RGB
*/
function HSVtoRGB(h, s, v) 
{
    let c = s * v;
    h = h/60;
    let x = c * (1 - Math.abs((h % 2) - 1))
    var r, g, b;
    if (h < 1) {
        r = c;
        g = x;
        b = 0;
    } else if (h < 2) {
        r = x;
        g = c;
        b = 0;
    } else if (h < 3) {
        r = 0;
        g = c;
        b = x;
    } else if (h < 4) {
        r = 0;
        g = x;
        b = c;
    } else if (h < 5) {
        r = x;
        g = 0;
        b = c;
    } else if (h < 6) {
        r = c;
        g = 0;
        b = x;
    }
    let m = v - c;
    let rgb = {r: r + m, g: g + m, b: b + m}
    return rgb;
}
