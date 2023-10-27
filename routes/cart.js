var express = require('express');
var router = express.Router();
var request = require('request');
//controllers
var pesapal = require('pesapal')({
    consumerKey: '',
    consumerSecret: '',
    testing: false,
});

// Get Product model
var Product = require('../models/product');
var Users = require('../models/user');
var Ref = require('../models/references');
const { response } = require('express');

/*
 * GET add product to cart
 */
router.get('/add/:product', function (req, res) {

    var slug = req.params.product;

    Product.findOne({slug: slug}, function (err, p) {
        if (err)
            console.log(err);

        if (typeof req.session.cart == "undefined") {
            req.session.cart = [];
            req.session.cart.push({
                title: slug,
                qty: 1,
                price: parseFloat(p.price).toFixed(2),
                image: '/product_images/' + p._id + '/' + p.image
            });
        } else {
            var cart = req.session.cart;
            var newItem = true;

            for (var i = 0; i < cart.length; i++) {
                if (cart[i].title == slug) {
                    cart[i].qty++;
                    newItem = false;
                    break;
                }
            }

            if (newItem) {
                cart.push({
                    title: slug,
                    qty: 1,
                    price: parseFloat(p.price).toFixed(2),
                    image: '/product_images/' + p._id + '/' + p.image
                });
            }
        }

//        console.log(req.session.cart);
        req.flash('success', 'Product added!');
        res.redirect('back');
    });

});

/*
 * GET checkout page
 */
var url2;
router.get('/checkout', function (req, res) {

    if (req.session.cart && req.session.cart.length == 0) {
        delete req.session.cart;
        res.redirect('/cart/checkout');
    } else {
        res.render('checkout', {
            title: 'Checkout',
            cart: req.session.cart
        });
    }

});
router.get('/checkout/mpesa', (req, res)=>{
    if (req.session.cart && req.session.cart.length == 0) {
        delete req.session.cart;
        res.redirect('/cart/checkout');
    } else {
        //randomly generated reference number
        var ref;
        (function(){
            var length = 15,
                charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
                retVal = "";
            for (var i = 0, n = charset.length; i < length; ++i) {
                retVal += charset.charAt(Math.floor(Math.random() * n));
            }
            ref = retVal;
            return retVal;
        })();

        //calculate date today
        var dateToday = new Date().toLocaleDateString();
        var timeNow = new Date();
        var period;
        if(timeNow.getHours()>=00 && timeNow.getHours()<12){
            period = 'AM'
        } else{
            period = "PM"
        }
        var timeObj = {
            fullTime : ()=>{
                return timeNow.getHours() +":" +timeNow.getMinutes() +":" +timeNow.getSeconds() +period
            }
        }

        //save reference number to database
        var references = new Ref({
            email: res.locals.user._doc.email,
            phoneNumber: res.locals.user._doc.phoneNumber,
            referenceNo: ref,
            dateStr: dateToday +" at " +timeObj.fullTime()
        });
        references.save(function (err) {
            if (err) {
                console.log(err);
            } else {
                console.log("References updated");

                //post a direct order
                var postParams = {
                    'oauth_callback': 'http:127.0.0.1:8081/cart/checkout/post_payment'
                }

                var requestData = {
                    'Amount': /*parseInt((req.session.cart[0].price))*/parseInt(1),
                    'Description': 'Total purchased items',
                    'Type': 'MERCHANT',
                    'Reference': ref,
                    'PhoneNumber': res.locals.user._doc.phoneNumber
                }
                var url = pesapal.postDirectOrder(postParams, requestData);
                console.log(url);
                res.redirect(url)
            }
        });
    }
})

//Post payment page
router.get('/checkout/post-payment', (req, res)=>{
    //get order status
    // get order status by ref

    var postParams = {
        'pesapal_merchant_reference': 'kSE72ov2Ia2zDSq'
    }
    var url = pesapal.queryPaymentStatusByMerchantRef(postParams);
    var request = require('superagent');
    request()
    .get(url)
    .end((err, response)=>{
        if(err) throw err;
        console.log(request.body)
    })
})

/*
 * GET update product
 */
router.get('/update/:product', function (req, res) {

    var slug = req.params.product;
    var cart = req.session.cart;
    var action = req.query.action;

    for (var i = 0; i < cart.length; i++) {
        if (cart[i].title == slug) {
            switch (action) {
                case "add":
                    cart[i].qty++;
                    break;
                case "remove":
                    cart[i].qty--;
                    if (cart[i].qty < 1)
                        cart.splice(i, 1);
                    break;
                case "clear":
                    cart.splice(i, 1);
                    if (cart.length == 0)
                        delete req.session.cart;
                    break;
                default:
                    console.log('update problem');
                    break;
            }
            break;
        }
    }

    req.flash('success', 'Cart updated!');
    res.redirect('/cart/checkout');

});

/*
 * GET clear cart
 */
router.get('/clear', function (req, res) {

    delete req.session.cart;
    
    req.flash('success', 'Cart cleared!');
    res.redirect('/cart/checkout');

});

/*
 * GET buy now
 */
router.get('/buynow', function (req, res) {

    delete req.session.cart;
    
    res.sendStatus(200);

});

// Exports
module.exports = router;
