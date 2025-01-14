import { find, filter, reduce, uniqBy } from 'lodash-es';
import { newCustomResource, newCustomResourceClass } from './customresourcefactory';

export class MobileService {
  constructor(json = {}) {
    this.data = json;
    this.configuration = this.data.configuration || [];
    this.configurationExt = this.data.configurationExt || [];
    this.setupText = '';

    if (this.data.bindCustomResource) {
      this.customResourceClass = newCustomResourceClass(this.data);
    }

    this.customResources = [];
    if (this.data.customResources) {
      for (const customResource of this.data.customResources) {
        this.customResources.push(newCustomResource(this.data, customResource));
      }
    }
  }

  getName() {
    return this.data.name;
  }

  getId() {
    return this.data.name;
  }

  getDescription() {
    return this.data.description;
  }

  getLogoUrl() {
    return this.data.icon;
  }

  getIconClass() {
    return this.data.iconClass;
  }

  isBound() {
    return this.customResources.length > 0 && find(this.customResources, cr => cr.isReady());
  }

  isBoundToApp(appName) {
    return this.customResources.length > 0 && find(this.customResources, cr => cr.isReady() && cr.hasAppLabel(appName));
  }

  getCustomResourcesForApp(appName) {
    return filter(this.customResources, cr => cr.hasAppLabel(appName));
  }

  getServiceInstanceName() {
    return this.data.name;
  }

  getSetupText() {
    return this.setupText;
  }

  getBindingForm(params) {
    return this.customResourceClass.bindForm(params);
  }

  isBindingOperationInProgress() {
    const inprogressCR = find(this.customResources, cr => cr.isInProgress());
    return inprogressCR != null;
  }

  getBindingOperation() {
    const inprogressCR = find(this.customResources, cr => cr.isInProgress());
    if (inprogressCR) {
      return inprogressCR.getCurrentOperation();
    }
    return undefined;
  }

  isBindingOperationFailed() {
    const failedCR = find(this.customResources, cr => cr.isFailed());
    return failedCR != null;
  }

  isUPSService() {
    return this.data.type === 'push';
  }

  customResourceDef() {
    return this.data.bindCustomResource;
  }

  newCustomResource(formdata) {
    return this.customResourceClass.newInstance(formdata);
  }

  getConfiguration(appName, options) {
    const crs = this.getCustomResourcesForApp(appName);
    const configurations = reduce(crs, (all, cr) => all.concat(cr.getConfiguration(this.data.url, options)), []);
    const uniqConfigs = uniqBy(configurations, config => config.label);
    return uniqConfigs;
  }

  getConfigurationExt() {
    return this.data.configurationExt;
  }

  getConfigurationExtAsJSON() {
    // configExt field example value:
    // it is an array of annotations that start with org.aerogear.binding-ext
    // and our annotation's value is also an array
    /*
      [
        [
          {
            "type": "android",
            "typeLabel": "Android",
            "url": "https://ups-mdc.127.0.0.1.nip.io/#/app/8936dead-7552-4b55-905c-926752c759af/variants/d6f4836a-11df-42d1-a442-e9cc823715a4",
            "id": "d6f4836a-11df-42d1-a442-e9cc823715a4"
          }
        ]
      ]
      */
    if (!this.data.configurationExt || !this.data.configurationExt.length) {
      return undefined;
    }

    const configExtItems = [];

    for (const configItemStr of this.data.configurationExt) {
      let configExtItem;
      try {
        configExtItem = JSON.parse(configItemStr);
        configExtItems.push(configExtItem);
      } catch (err) {
        // not much we can do if the annotation is malformed
      }
    }

    return configExtItems;
  }

  getDocumentationUrl() {
    return this.customResourceClass.getDocumentationUrl();
  }

  toJSON() {
    return {
      ...this.data,
      configuration: this.configuration,
      configurationExt: this.configurationExt
    };
  }
}
