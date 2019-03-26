// add HTMLElement as valid selector for $

declare module "meteor/blaze" {
    namespace Blaze {
        interface TemplateInstance {
            $(selector: HTMLElement): JQuery;
        }
    }
}
