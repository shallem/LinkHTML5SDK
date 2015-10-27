/* 
 * Detects browser compatibility.
 */

Helix.compatibility = {
    animation: false
};

(function() {
    // Detect if animation is supported.
    var //animationstring = 'animation',
        //keyframeprefix = '',
        domPrefixes = 'Webkit Moz O ms Khtml'.split(' '),
        // pfx  = '',
        elm = document.createElement('div');

    if( elm.style.animationName !== undefined ) { 
        Helix.compatibility.animation = true; 
    }    

    if( Helix.compatibility.animation === false ) {
    for( var i = 0; i < domPrefixes.length; i++ ) {
        if( elm.style[ domPrefixes[i] + 'AnimationName' ] !== undefined ) {
            // pfx = domPrefixes[ i ];
            // animationstring = pfx + 'Animation';
            // keyframeprefix = '-' + pfx.toLowerCase() + '-';
            Helix.compatibility.animation = true;
            break;
        }
    }
}

})();


