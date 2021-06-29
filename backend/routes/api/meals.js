const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

const auth = require('../../middleware/auth');
const Meal = require('../../models/Meal');

// @route   GET api/meal
// @desc    If the date is present, fetch meal on said date. 
//          Otherwise, fetch the latest 5 meals for a user. Format for 
//          dates should be simple date string using dashes (no time) ex: 2018-09-22
// @access  Private
router.get('/', auth, async (req, res) => {
    
    const {keywords, date} = req.query;

    console.log(date);

    try {
        let meals;
        if (keywords && date) {
            const dateArray = date.split('-'); // Year, Month, Day
            const startDate = new Date(dateArray[0], parseInt(dateArray[1]) - 1, dateArray[2]);
            const endDate = new Date(dateArray[0], parseInt(dateArray[1]) - 1, parseInt(dateArray[2]) + 1);

            meals = await Meal.find({
                    user: req.user.id, 
                    $text: {$search: keywords},
                    mealTime: {
                        $gte: startDate, 
                        $lt: endDate
                    }
                })
                .sort({mealTime: 'desc'});
        }
        else if (date) {
            const dateArray = date.split('-'); // Year, Month, Day
            const startDate = new Date(dateArray[0], parseInt(dateArray[1]) - 1, dateArray[2]);
            const endDate = new Date(dateArray[0], parseInt(dateArray[1]) - 1, parseInt(dateArray[2]) + 1);

            meals = await Meal.find({
                    user: req.user.id, 
                    mealTime: {
                        $gte: startDate, 
                        $lt: endDate
                    }
                })
                .sort({mealTime: 'desc'});

        }
        else if (keywords) {
            meals = await Meal.find({ user: req.user.id, $text: {$search: keywords} })
                .sort({mealTime: 'desc'});
        } 
        else {
            meals = await Meal.find({ user: req.user.id })
                .sort({mealTime: 'desc'})
                .limit(5);
        }

        if (!meals || meals.length < 1) {
            return res.status(400).json({ errors: [{ msg: 'No meal found with given parameters' }] });
        }
        res.json(meals);
    }
    catch(err) {
        console.error("Meal Fetch Err - " + err.message);
        return res.status(500).send('Server error');
    }
});

// @route   GET api/meal/id
// @desc    Fetch a single meal by id
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const meal = await Meal.findById(req.params.id);

        if (!meal) {
            return res.status(400).json({ errors: [{ msg: 'Meal does not exist' }] });
        }

        // Check that the meal belongs to the authorized user
        if (meal.user != req.user.id) {
            return res.status(400).json({ errors: [{ msg: 'Not authorized to access this resource' }] });
        }

        res.json(meal);
    }
    catch(err) {
        console.error("Meal Fetch Err - " + err.message);
        return res.status(500).send('Server error');
    }
});

// @route   POST api/meal
// @desc    Create or update a meal chunk
// @access  Private
router.post('/', [ auth, [
    check('type', 'Meal type is required')
        .not()
        .isEmpty(),
    check('mealTime', 'Meal time is required')
        .not()
        .isEmpty(),
    check('plateSize', 'Plate size is required')
        .not()
        .isEmpty()
] ], 
async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { id, type, mealTime, desc, plateSize, portions } = req.body;

    try {
        // Create the meal field object
        let mealFields = {
            type: type,
            user: req.user.id,
            mealTime: mealTime,
            plateSize: plateSize
        };
        // Add optional fields
        if (desc) 
            mealFields.desc = desc; 
        if (portions.length > 0) 
            mealFields.portions = portions; 

        let meal;

        // If id is present, attempt update 
        if (id) {
            meal = await Meal.findById(id);

            if (meal) {
                // Check that the meal belongs to the authorized user
                if (meal.user != req.user.id) {
                    return res.status(400).json({ errors: [{ msg: 'Not authorized to access this resource' }] });
                }

                // Update the existing meal
                meal = await Meal.findByIdAndUpdate( 
                    id, 
                    { $set: mealFields }, 
                    { new: true }
                );

                return res.json(meal);
            }
        }
        
        // Otherwise create new meal
        meal = new Meal(mealFields);
        await meal.save();

        res.json(meal);
    }
    catch(err) {
        console.error("Meal Post Err - " + err.message);
        return res.status(500).send('Server error');
    }
});

// @route   DELETE api/meal/id
// @desc    Delete a meal chunk by id
// @access  Private
router.delete(`/:id`, auth, async (req, res) => {
    try {
        let meal = await Meal.findOneAndDelete( { _id: req.params.id, user: req.user.id } );
        // Check that the meal exists and belongs to the authorized user
        if (!meal) {
            return res.status(400).json({ errors: [{ msg: 'Meal does not exist for current user' }] });
        }
        res.json(meal);
    }
    catch(err) {
        console.error("Meal Delete Err - " + err.message);
        return res.status(500).send('Server error');
    }
});

module.exports = router;