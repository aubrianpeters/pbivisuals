module powerbi.extensibility.visual {
    /**
     * Gets property value for a particular object.
     *
     * @function
     * @param {DataViewObjects} objects - Map of defined objects.
     * @param {string} objectName       - Name of desired object.
     * @param {string} propertyName     - Name of desired property.
     * @param {T} defaultValue          - Default value of desired property.
     */
    export function getObjectValue<T>(objects: DataViewObjects, objectName: string, propertyName: string, defaultValue: T ): T {
        if(objects) {
            const object = objects[objectName];
            if(object) {
                const property: T = object[propertyName];
                if(property !== undefined) {
                    return property;
                }
            }
        }
        return defaultValue;
    }

    /**
     * Gets property value for a particular object.
     *
     * @function
     * @param {DataViewMetadataColumn[]} columns - Array of defined columns.
     * @param {string} objectName       - Name of desired object.
     * @param {string} propertyName     - Name of desired property.
     * @param {T} defaultValue          - Default value of desired property.
     */
    export function getColumnValue<T>(columns: DataViewMetadataColumn[], columnName: string, propertyName: string, defaultValue: T): T {
        if (columns) {
            const object = columns[columnName];
            if (object) {
                const property: T = object[propertyName];
                if (property !== undefined) {
                    return property;
                }
            }
        }
        return defaultValue;
    }

    /**
     * Gets property value for a particular object in a category.
     *
     * @function
     * @param {DataViewCategoryColumn} category - List of category objects.
     * @param {number} index                    - Index of category object.
     * @param {string} objectName               - Name of desired object.
     * @param {string} propertyName             - Name of desired property.
     * @param {T} defaultValue                  - Default value of desired property.
     */
    export function getCategoricalObjectValue<T>(category: DataViewCategoryColumn, index: number, objectName: string, propertyName: string, defaultValue: T): T {
        const categoryObjects = category.objects;

        if(categoryObjects) {
            const categoryObject: DataViewObject = categoryObjects[index];
            if(categoryObject) {
                const object = categoryObject[objectName];
                if(object) {
                    const property: T = object[propertyName];
                    if(property !== undefined) {
                        return property;
                    }
                }
            }
        }
        return defaultValue;
    }

    export function getCategoricalValue<T>(options: VisualUpdateOptions, index: number, objectName: string, defaultValue: T): T {
        if (options.dataViews && options.dataViews[index] && options.dataViews[index].categorical && options.dataViews[index].categorical.values && options.dataViews[index].categorical.values.length > 0)
            for (let i = 0; i < options.dataViews[index].categorical.values.length; i++) {
                if (options.dataViews[index].categorical.values[i].source.roles.hasOwnProperty(objectName)) {
                    const property: T = options.dataViews[index].categorical.values[i].values[0];
                    if (property !== undefined) {
                        return property;
                    }
                }
            }
        return defaultValue;
    }
}