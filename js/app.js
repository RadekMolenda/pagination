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
        PrevView,
        Filter;

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
        },

        filtered: function() {
            return this.filter(Filter, this);
        }

    });

    Filter = function(page) {
        var index = this.indexOf(page),
            selected = this.selectedIndex(),
            distanceSelected = Math.abs(selected - index),
            lastTwo = this.length - 2;
        if(selected <= 5){
            return (index <= 7) ||
               (index >= lastTwo) ||
               (distanceSelected <= 2);
        } else if (selected >= this.length - 6) {
            return (index >= this.length - 8) ||
               (index < 2) ||
               (distanceSelected <= 2);
        } else {
            return (index < 2) ||
                   (index >= lastTwo) ||
                   (distanceSelected <= 2);
        }
    };

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
            this.listenTo(this.collection, 'page:selected', this.renderFiltered);
        },

        render: function() {
            this.renderFiltered();
            return this;
        },

        renderFiltered: function () {
            var filtered = this.mapFiltered(this.collection.filtered(), this.collection);
            this.$el.html(filtered);
        },

        mapFiltered: function (coll, pages) {
            var pair = _.first(coll, 2),
                first = pair[0],
                next = pair[1],
                navPageView,
                elipsisView;

            if(_.isEmpty(coll)) {
                return [];
            } else {
                navPageView = new NavPageView({model: first, collection: pages});
                if(next !== undefined && (pages.indexOf(next) - pages.indexOf(first) !== 1)) {
                    elipsisView = new ElipsisView({});
                    return [navPageView.render().el, elipsisView.render().el].concat(this.mapFiltered(_.rest(coll), pages));
                } else {
                    return [navPageView.render().el].concat(this.mapFiltered(_.rest(coll), pages));
                }
            }
        }
    });

    ElipsisView = Backbone.View.extend({
        tagName: 'li',

        template: _.template('<span class="page inactive elipsis el">...</span>'),

        render: function () {
            this.$el.html(this.template({}));
            return this;
        },

    })

    NavPageView = Backbone.View.extend({

        tagName: 'li',

        selected_template: _.template('<span class="page active el"><%= no %></span>'),

        unselected_template: _.template('<a class="page inactive el"><%= no %></a>'),

        initialize: function() {
            this.listenTo(this.collection, 'page:selected', this.render);
        },

        render: function () {
            if(this.model.isSelected()) {
                this.$el.html(this.selected_template({no: this.collection.indexOf(this.model) + 1}));
            } else {
                this.$el.html(this.unselected_template({no: this.collection.indexOf(this.model) + 1}));
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
