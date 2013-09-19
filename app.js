(function() {

  var STATUS_CLOSED = 'closed';

  return {
    defaultState: 'loading',

    requests: {
      addTask: function(task) {
        var id = this.taskid;
        this.tasks.push({'id': id, 'done': false, 'title': task});

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
      updateTasks: function() {
        // get all tasks and build array

        var newtasks = [];
        var donetasks = [];
        var deletedtasks = [];
        
        for(var i=0; i<this.tasks.length; i++) {
          var task = this.$('#task-' + this.tasks[i].id);

          // deleted ?
          var deleted = task.find('.task-delete').attr('checked');

          if(!deleted) {
            // done ?
            var done = task.find('.task-done').attr('checked');
            if(!done) {
              this.tasks[i].done = false;
            } else {
              this.tasks[i].done = true;
            }
            newtasks.push(this.tasks[i]);
          } else {
            deletedtasks.push(this.tasks[i].title);
          }
        }

        this.tasks = newtasks;

        if(!this.tasks.length) this.tasks.push({'id': 0});

        var donestr = '';
        var deletedstr = '';

        if(donetasks.length) {
          donestr = "\r \n Completed Tasks: \r \n" + donetasks.join("\r \n");
        }

        if(deletedtasks.length) {
          deletedstr = "\r \n Deleted Tasks: \r \n" + deletedtasks.join("\r \n");
        }

        return {
          url: '/api/v2/tickets/' + this.ticket().id() + '.json',
          type: 'PUT',
          data: {
            "ticket": {
              "metadata": { "tasks": this.tasks },
              "comment":  { "body": "Updated tasks" + donestr + deletedstr, "public": false }
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
        this.switchTo('fetch_failed');
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

      'updateTasks.done': function() {
        services.notify(this.I18n.t('update.done', { id: this.ticket().id() }));
      },

      'updateTasks.fail': function() {
        services.notify(this.I18n.t('update.failed', { id: this.ticket().id() }), 'error');
      },

      'updateTasks.always': function() {
        this.ajax('getTasks');
      },

      'click .addtask': function(event) {
        event.preventDefault();
        var task = this.$('#newtask').val();
        this.ajax('addTask', task);
      },

      'click .updatetasks': function(event) {
        event.preventDefault();
        this.ajax('updateTasks');
      }
    },

    renderTasks: function(audits) {
      this.taskid = audits.length;

      // get the last audit with tasks metadata
      this.tasks = [];
      for(var i = audits.length; i > 0; i--) {
        var j = i - 1;
        if('custom' in audits[j].metadata) {
          if('tasks' in audits[j].metadata.custom) {
            var t = audits[j].metadata.custom.tasks;

            // convert to array
            for (var key in t) {
              if(t[key].id !== '0') {
                t[key].done = (t[key].done == 'true') ? true : false;
                this.tasks.push(t[key]);
              }
            }

            // got latest tasks, break the loop
            i = 0;
          }
        }
      }

      this.switchTo('list', {
        tasks: this.tasks
      });
    },

    requestTasks: function() {
      this.ajax('getTasks');
    }
  };

}());
