$(function() {
    var Page, Pages, PageView, PaginationView, NavPageView;

    Page = Backbone.Model.extend({
        defaults: {
            headline: '',
            selected: false
        },

        isSelected: function(){
            return this.get('selected');
        },

        select: function(){
            this.set({'selected': true});
        },

        unselect: function() {
            this.set({'selected': false});
        }
    });

    PagesList = Backbone.Collection.extend({
        model: Page,

        selectedPage: function() {
            return this.selected;
        },

        select: function(model) {
            if ( this.selectedPage() ){
                this.selectedPage().unselect();
            }

            this.selected = model;
            this.selected.select();
            this.trigger('page:selected');
        },

        selectNext: function() {
            this.select(this.at(this.nextToSelect()));
        },

        selectPrev: function () {
            this.select(this.at(this.prevToSelect()));
        },

        nextToSelect: function () {
            var index = this.selectedIndex() + 1;
            if(index >= this.length) {
                return this.selectedIndex();
            } else {
                return index;
            }
        },

        prevToSelect: function () {
            var index = this.selectedIndex() - 1;
            if(index < 0) {
                return this.selectedIndex();
            } else {
                return index;
            }
        },

        selectedIndex: function () {
            return this.indexOf(this.selectedPage());
        }

    });

    var Pages = new PagesList(window.feed_data);

    PrevView = Backbone.View.extend({

        initialize: function () {
            this.listenTo(this.collection, "page:selected", this.toggleActive);
        },

        events: {
            "click": "prev"
        },

        prev: function () {
            this.collection.selectPrev();
        },
    });

    NextView = Backbone.View.extend({
        initialize: function () {
            this.listenTo(this.collection, "page:selected", this.toggleActive);
        },

        events: {
            "click": "next"
        },

        next: function () {
            this.collection.selectNext();
        },

    });

    PageView = Backbone.View.extend({
        template: _.template('<p><%= headline %></p>'),

        el: $('#page'),

        initialize: function() {
            this.listenTo(this.collection, 'page:selected', this.render);
        },

        render: function() {
            this.$el.html(this.template(this.collection.selectedPage().toJSON()));
            return this;
        },

    });

    PaginationView = Backbone.View.extend({
        tagName: 'ul',

        className: 'nav',

        initialize: function () {
            this.addAll()
            this.collection.select(this.collection.first());
        },

        render: function() {
            this.addAll();
            return this;
        },

        addAll: function(){
            Pages.each(this.addOne, this);
        },

        addOne: function(page){
            var view = new NavPageView({model: page, collection: Pages});
            this.$el.append(view.render().el);
        }

    });

    NavPageView = Backbone.View.extend({

        tagName: 'li',

        selected_template: _.template('<span class="page active el"><%= no %></span>'),

        unselected_template: _.template('<a class="page inactive el"><%= no %></a>'),

        initialize: function() {
            this.listenTo(this.collection, 'page:selected', this.render);
        },

        render: function () {
            if(this.model.isSelected()) {
                this.$el.html(this.selected_template({no: Pages.indexOf(this.model) + 1}));
            } else {
                this.$el.html(this.unselected_template({no: Pages.indexOf(this.model) + 1}));
            }
            return this;
        },

        events: {
            "click .inactive": "select"
        },

        select: function () {
            this.collection.select(this.model);
        }

    });
    window.PageView = PageView;
    window.Pages = Pages;
    window.Page = Page;
    window.pageView = new PageView({collection: Pages});
    window.prevView = new PrevView({collection: Pages, el: $('.prev a')});
    window.nextView = new NextView({collection: Pages, el: $('.next a')});
});
