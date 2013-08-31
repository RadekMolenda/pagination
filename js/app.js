$(function() {
    var Page,
        Pages,
        PageView,
        PageNumberView,
        PaginationView,
        NavPageView,
        AppView,
        RemoteView,
        NextView,
        PrevView;

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
            if( !this.lastSelected() ) {
                this.select(this.nextPage());
            }
        },

        nextPage: function() {
            return this.at(this.selectedIndex() + 1);
        },

        selectPrev: function () {
            if( !this.firstSelected() ){
                this.select(this.prevPage());
            }
        },

        prevPage: function() {
            return this.at(this.selectedIndex() - 1);
        },

        lastSelected: function() {
            return this.selectedPage() === this.last();
        },

        firstSelected: function() {
            return this.selectedPage() === this.first();
        },

        selectedIndex: function () {
            return this.indexOf(this.selectedPage());
        }

    });

    var Pages = new PagesList(window.feed_data);


    RemoteView = Backbone.View.extend({

        disabled_template: _.template('<span class="page disabled"><%= name %></span>'),

        template: _.template('<a href="#" class="page"><%= name %></a>'),

        initialize: function () {
            this.listenTo(this.collection, "page:selected", this.render);
        },

        renderControl: function (name, cmp) {
            var template
            if(cmp){
                template = this.disabled_template;
            } else {
                template = this.template;
            }


            this.$el.html(template({"name": name}));
            return this;
        }
    });

    PrevView = RemoteView.extend({
        className: 'remote prev',

        events: {
            "click a": "prev"
        },

        prev: function () {
            this.collection.selectPrev();
        },

        render: function () {
            this.renderControl("≺ Previous", this.collection.firstSelected());
            return this;
        }

    });

    NextView = RemoteView.extend({
        className: 'remote next',

        events: {
            "click a": "next"
        },

        next: function () {
            this.collection.selectNext();
        },

        render: function () {
            this.renderControl("Next ≻", this.collection.lastSelected());
            return this;
        }
    });

    PageView = Backbone.View.extend({
        template: _.template('<p><%= headline %></p>'),

        id: 'page',

        initialize: function() {
            this.listenTo(this.collection, 'page:selected', this.render);
        },

        render: function() {
            this.$el.html(this.template(this.collection.selectedPage().toJSON()));
            return this;
        },

    });

    PageNumberView = Backbone.View.extend({

        tagName: 'ul',

        className: 'nav',

        initialize: function () {
            this.collection.select(this.collection.first());
        },

        render: function() {
            this.addAll();
            return this;
        },

        addAll: function(){
            this.collection.each(this.addOne, this);
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

    PaginationView = Backbone.View.extend({
        render: function() {
            var pageNumberView, prevView, nextView;

            pageNumberView = new PageNumberView({collection: this.collection});
            prevView = new PrevView({collection: this.collection});
            nextView = new NextView({collection: this.collection});

            this.$el.append(pageNumberView.render().el);
            this.$el.append(nextView.render().el);
            this.$el.prepend(prevView.render().el);
            return this;
        }
    });

    AppView = Backbone.View.extend({
        initialize: function() {
            this.render()
        },

        render: function() {
            var pageView, paginationView;

            paginationView = new PaginationView({collection: this.collection});
            pageView = new PageView({collection: this.collection});

            this.$el.append(paginationView.render().el);
            this.$el.prepend(pageView.render().el);
            return this;
        }
    });

    window.appView = new AppView({collection: Pages, el: $('#app')});
});
