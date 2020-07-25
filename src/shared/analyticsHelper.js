class AnalyticsHelper {
    dataAttributesClickListener = null;

    static trackEvent(category, action, label, value) {
        label = label || category + ' ' + action;
        _gaq.push(['_trackEvent', category, action, label, parseInt(value)]);
    }

    static hasTrackingDataDefined(element) {
        return element.hasAttribute('data-category') && element.hasAttribute('data-action');
    }

    static clickEventHandler(event) {
        const elementClicked = event.target;

        if (!AnalyticsHelper.hasTrackingDataDefined(elementClicked)) {
            return;
        }

        const category = elementClicked.getAttribute('data-category'),
            action = elementClicked.getAttribute('data-action') || 'clicked',
            label = elementClicked.getAttribute('data-label'),
            value = elementClicked.getAttribute('data-value');

        this.trackEvent(category, action, label, value);
    }

    static trackTabChangedOnNotificationsPage(area, itemsCount) {
        const categories = SW.TRACKING_INFO.CATEGORIES,
            viewedAction = SW.TRACKING_INFO.ACTIONS.VIEWED,
            labels = SW.TRACKING_INFO.LABELS;
        
        switch (area) {
            // Question Notifications
            case 'notification-area':
                this.trackEvent(
                    categories.QUESTION_NOTIFS,
                    viewedAction,
                    labels.NP_QN_VIEWED,
                    itemsCount
                );
                break;
    
            case 'user-notification-area':
                this.trackEvent(
                    categories.USER_NOTIFS,
                    viewedAction,
                    labels.NP_UN_VIEWED,
                    itemsCount
                );
                break;
    
            case 'question-area':
                this.trackEvent(
                    categories.QUESTIONS,
                    viewedAction,
                    labels.NP_Q_VIEWED,
                    itemsCount
                );
                break;
    
            case 'users-area':
                this.trackEvent(
                    categories.USERS,
                    viewedAction,
                    labels.NP_U_VIEWED,
                    itemsCount
                );
                break;

            case 'settings-area':
                this.trackEvent(
                    categories.SETTINGS,
                    viewedAction,
                    labels.NP_SETTINGS_VIEWED,
                    0
                );
                break;
          }
    }

    static enableDataAttributesTracking() {
        $(document).on('click', AnalyticsHelper.clickEventHandler);
    };

    static disableDataAttributesTracking() {
        $(document).off('click', AnalyticsHelper.clickEventHandler);
    };
}
