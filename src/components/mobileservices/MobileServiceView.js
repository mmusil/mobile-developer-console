import React, { Component } from 'react';
import { EmptyState, Spinner } from 'patternfly-react';
import { connect } from 'react-redux';
import { partition } from 'lodash-es';
import BoundServiceRow from './BoundServiceRow';
import UnboundServiceRow from './UnboundServiceRow';
import './MobileServiceView.css';
import { fetchAndWatchServices, deleteCustomResource } from '../../actions/services';
import BindingPanel from './BindingPanel';
import { MobileService, MobileApp } from '../../models/';

class MobileServiceView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      bindingPanelService: null
    };

    this.boundServiceRows = this.boundServiceRows.bind(this);
    this.unboundServiceRows = this.unboundServiceRows.bind(this);
    this.hideBindingPanel = this.hideBindingPanel.bind(this);
  }

  componentDidMount() {
    this.props.fetchAndWatchServices();
  }

  /**
   * Used to provide custom configuration values to the BoundServiceRow and UnboundServiceRow.
   *
   * @param {String} type - The service type
   * @returns {Object}
   * @memberof MobileServiceView
   */
  getConfigurationOptions(type) {
    if (!this.props.app) {
      return null;
    }

    const {
      status: {
        data: { services }
      }
    } = this.props.app;

    let options = {};
    if (type === 'security') {
      const securityService = services.find(s => s.name === 'security');
      if (securityService) {
        options = {
          url: securityService.url
        };
      }
    }
    return options;
  }

  boundServiceRows() {
    return (
      <React.Fragment>
        <h2 key="bound-services">Bound Services</h2>
        {this.props.boundServices && this.props.boundServices.length > 0 ? (
          this.props.boundServices.map(service => (
            <BoundServiceRow
              key={service.getId()}
              appName={this.props.appName}
              service={service}
              configurationOptions={this.getConfigurationOptions(service.data.type, this.props.app)}
              onCreateBinding={() => this.showBindingPanel(service)}
              onFinished={this.hideBindingPanel}
              onDeleteBinding={cr => this.props.deleteCustomResource(service, cr.toJSON())}
            />
          ))
        ) : (
          <EmptyState>There are no bound services.</EmptyState>
        )}
      </React.Fragment>
    );
  }

  unboundServiceRows() {
    return (
      <React.Fragment>
        <h2 key="unbound-services">Unbound Services</h2>
        {this.props.unboundServices && this.props.unboundServices.length > 0 ? (
          this.props.unboundServices.map(service => (
            <UnboundServiceRow
              key={service.getId()}
              service={service}
              onCreateBinding={() => this.showBindingPanel(service)}
              onFinished={this.hideBindingPanel}
            />
          ))
        ) : (
          <EmptyState>There are no unbound services.</EmptyState>
        )}
      </React.Fragment>
    );
  }

  shouldComponentUpdate() {
    return true;
  }

  showBindingPanel = service => {
    this.setState({
      bindingPanelService: service
    });
  };

  hideBindingPanel = () => {
    if (this.state.bindingPanelService) {
      this.setState({
        bindingPanelService: null
      });
    }
  };

  render() {
    const { isReading = true, boundServices, unboundServices } = this.props;
    return (
      <div className="mobile-service-view">
        <Spinner
          loading={isReading && boundServices.length === 0 && unboundServices.length === 0}
          className="spinner-padding"
        >
          {this.boundServiceRows()}
          {this.unboundServiceRows()}
        </Spinner>
        {this.state.bindingPanelService && (
          <BindingPanel
            appName={this.props.appName}
            service={this.state.bindingPanelService}
            showModal
            close={this.hideBindingPanel}
          />
        )}
      </div>
    );
  }
}

function mapStateToProps(state, oldProp) {
  const app = MobileApp.find(state.apps.items, oldProp.appName);
  const services = state.services.items.filter(item => !item.disabled).map(item => new MobileService(item));
  const filteredServices = partition(services, service => service.isBoundToApp(oldProp.appName));
  return { ...state.services, app, boundServices: filteredServices[0], unboundServices: filteredServices[1] };
}

const mapDispatchToProps = {
  fetchAndWatchServices,
  deleteCustomResource
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MobileServiceView);
