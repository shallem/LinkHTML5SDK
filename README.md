The Link HTML5 SDK
==================

The Link HTML5 SDK by Mobile Helix is an open-source HTML5 SDK for
building enterprise applications using either HTML5/CSS3/JavaScript or
JSF2/HTML5/CSS3/JavaScript. Applications built using the SDK will
operate across any platform, including mobile devices (using mobile
Safari for iOS or Chrome), laptops/desktops (using either Chrome or
Safari), or within the Link Container, integrated into the Link
product from Mobile Helix. Integration with the Link Container
provides transparent data security, authentication, and key
management, all of which must be implemented by the particular
application if it runs in a standard browser without Link.

The best place to start with the SDK is in the doc/ directory. The
file LinkSDKMasterDocumentation provides an overview of the SDK and
documents a subset of the capabilities available in the SDK. We are
still in Alpha, so the documentation is lagging a bit behind the
capabilities of the product. Should you wonder if a particular feature
of interest is available in the SDK, please feel free to contact us at
support@mobilehelix.com.

Licensing
=========

The Link SDK is licensed under the Apache License, Version 2.0. This
license enables free usage in both commercial and non-commercial
contexts, and we intend to keep it that way. Individual components are
governed under separate license when applicable (e.g., jQuery Mobile
and jQuery are governed by the MIT License), but we have taken care to
ensure that each component is fully open and free software, with no
"copy-left" provisions used in any GPL, LGPL, or AGPL license. Most
components are licensed under an MIT, BSD, or Apache-style license
with a few variations on that theme. As we complete our documentation
we will take care to clearly explain any licensing implications of the
various 3rd party components.

jQuery Mobile
=============

At the heart of the Link HTML5 SDK is jQuery Mobile, v1.3.2. In
addition, we have wrapped certain jQM components in our on plugins to
provide additional features, such as native-style scrolling on touch
devices and rich-text editing. We have also added a number of features
to simplify client-side DOM generation for common enterprise tasks,
like displaying and editing form data. 

Data Storage
============

On top of the jQuery Mobile UI layer, we have integrated, enhanced,
and fixed the PersistenceJS O-R-M library such that it provides an
access layer to HTML5's offline storage. Our AJAX libraries enable a
simple integration with any back-end servlet that returns objects
serialized as JSON data. Using this integration these objects are
automatically converted into database schema and stored. We currently
support webSQL as an underlying browser storage mechanism, but
IndexedDB support is in the roadmap.

Integration with JSF and PrimeFaces
===================================

Finally, we have built a JSF2 integration as a derivative of the
PrimeFaces Mobile project. The render kit and components that we have
built can be used in conjunction with PrimeFaces and PrimeFaces
Extensions. In the near future we intend to make our library co-exist
with PrimeFaces Mobile as well, so that users can benefit from the
best of all aspects of the PrimeFaces component suite. We also intend
to make our JSF integration function standalone without
PrimeFaces. Stay tuned for our progress on these items.

Collaborate with Us!
====================

We hope to build an active and thriving community of enterprise HTML5
developers who take advantage of the Link SDK to build world-class
apps that run on any platform, mobile or fixed. To that end, we are
open to your questions, issue reports, pull requests, etc. Feel free
to download the SDK and give it a try, with the major caveat that
until stated otherwise the SDK is in Alpha. That said, our production
release is not far away so most of the basic functionality available
in the SDK is working.

Can I see a Demo?
=================

We are almost there ... we do intend to create a showcase with code
samples but we haven't quite gotten to it yet. In the interim, if you
want to see a demo of the SDK in action please contact Mobile Helix.