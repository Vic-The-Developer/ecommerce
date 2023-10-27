var mongoose = require('mongoose');

// Product Schema
var RefSchema = mongoose.Schema({
   
    email: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String
    },
    referenceNo: {
        type: String,
        required: true
    },
    dateStr: {
        type: String,
    }
    
});

var Ref = module.exports = mongoose.model('references', RefSchema);