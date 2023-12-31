var express = require('express');
var router = express.Router();

// Get Page model
var Page = require('../models/page');

// Get Product model
var Product = require('../models/product');

/*
 * GET /
 */
router.get('/', function (req, res) {
    
    // Page.findOne({slug: 'home'}, function (err, page) {
    //     if (err)
    //         console.log(err);

    //     res.render('', {
    //         title: page.title,
    //         content: page.content
    //     });
    // });
    
    Product.find(function (err, products) {
        if (err)
            console.log(err);

        res.render('all_products', {
            title: 'All products',
            products: products
        });
    });
    
});

/*
 * GET a page
 */
router.get('/:slug', function (req, res) {

    var slug = req.params.slug;

    Page.findOne({slug: slug}, function (err, page) {
        if (err)
            console.log(err);
        
        if (!page) {
            res.redirect('/');
        } else {
            res.render('index', {
                title: page.title,
                content: page.content
            });
        }
    });

    
});

// Exports
module.exports = router;