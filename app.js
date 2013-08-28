(function() {

  var STATUS_CLOSED = 'closed';

  return {
    defaultState: 'loading',

    requests: {
      addTask: function(task) {
        this.tasks.push({'active': true, 'task': task});

        return {
          url: '/api/v2/tickets/' + this.ticket().id() + '.json',
          type: 'PUT',
          data: {
            'ticket': {
              'metadata': { 'tasks': this.tasks },
              'comment':  { 'body': 'Added task: ' + task, 'public': false }
            }
          }
        };
      },
      getTasks: function(task) {
        return {
          url: '/api/v2/tickets/' + this.ticket().id() + '/audits.json',
          type: 'GET'
        };
      }
    },

    events: {
      'app.activated': 'requestTasks',

      'getTasks.done': function(data) {
        this.renderTasks((data || {}).audits);
      },

      'getTasks.fail': function(data) {
        this.switchTo('fetch_fail');
      },

      'addTask.done': function() {
        services.notify(this.I18n.t('add.done', { id: this.ticket().id() }));
      },

      'addTask.fail': function() {
        services.notify(this.I18n.t('add.failed', { id: this.ticket().id() }), 'error');
      },

      'addTask.always': function() {
        this.ajax('getTasks');
      },

      'click .addtask': function(event) {
        event.preventDefault();
        var task = this.$('#newtask').val();
        this.ajax('addTask', task);
      }
    },

    renderTasks: function(audits) {
      // get the last audit with tasks metadata
      this.tasks = [];
      console.log(audits);
      for(var i = audits.length; i > 0; i--) {
        var j = i - 1;
        if('custom' in audits[j].metadata) {
          if('tasks' in audits[j].metadata.custom) {
            var t = audits[j].metadata.custom.tasks;

            // convert to array
            for (var key in t) {
              this.tasks.push(t[key]);
            }

            // got latest tasks, break the loop
            i = 0;
          }
        }
      }

      console.log(this.tasks);

      this.switchTo('list', {
        tasks: this.tasks
      });
    },

    requestTasks: function() {
      this.ajax('getTasks');
    }
  };

}());
