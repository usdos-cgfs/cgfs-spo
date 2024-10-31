/*
    SharePoint Acces Layer - SAL.js

    Abstract any functions that rely on reading or setting SP items to here.

    Create a new "Connection" object type that will store information for 
    interfacing with a specific list.

    Author: Peter Backlund 
    Contact: backlundpf <@> state.gov
    Created: 2018-02-12
*/


var sal = window.sal || {};
sal.globalConfig = sal.globalConfig || {};
sal.site = sal.site || {};

sal.init = function () {
    // Initialize the sitewide settings here.
    sal.globalConfig.siteUrl = $().SPServices.SPGetCurrentSite();
    sal.globalConfig.user = $().SPServices.SPGetCurrentUser({
        fieldName: "Title",
        debug: false
    });
    sal.globalConfig.listServices = '../_vti_bin/ListData.svc/';

    sal.site = new sal.siteConnection;

}

sal.siteConnection = function () {
    function userInGroup (group) {
      var inGroup = false;
        $().SPServices({

            operation: 'GetGroupCollectionFromUser',
            userLoginName: $().SPServices.SPGetCurrentUser(),
            async: false,
            completefunc: function (xData, Status) {
                if ($(xData.responseXML).find('Group[Name="' + group + '"]').length == 1) {

                  inGroup = true;
                }
                else {
                  //alert('not in group ' + group)
                  inGroup = false;
                }
            }
        });
      return inGroup;
    }

    var publicMembers = {
      userInGroup: function (group) {return userInGroup(group)}
    };

    return publicMembers;
}

sal.newConnection = function () {
    var self = this;

    var config = {};
    /* Minimum config requires a listName element e.g.
        config = {
            listName: 'PageViews',
        }
    */

    //function init() {
    //}

    function getItemId(fieldRef, valueType, value) {
        var camlQ = "<Query><Where><Eq><FieldRef Name='" + fieldRef + "'/><Value Type='" + valueType + "'>" + value + "</Value></Eq></Where></Query>";
        //alert(camlQ);
        var idArr = [];
        var itemCount;
        $().SPServices({
            operation: "GetListItems",
            CAMLQuery: camlQ,
            async: false,
            webURL: sal.globalConfig.siteUrl,
            listName: config.listName,
            CAMLViewFields: "<ViewFields Properties='True' />",
            //CAMLViewFields: viewfields,
            completefunc: function (xData, Status) {
                //alert(xData.responseXML.xml);
                itemCount = Number($(xData.responseXML).SPFilterNode("rs:data").attr("ItemCount"));
                if (itemCount > 0) {
                    $(xData.responseXML).SPFilterNode("z:row").each(function () {
                        var id = $(this).attr("ows_ID");
                        idArr.push(id);
                    });
                }
            }
        });
        return idArr[0];
    }

    function showModal(formName, title, args, callback) {
        var id = '';
        var options = SP.UI.$create_DialogOptions();
        options.title = title;
        options.dialogReturnValueCallback = callback;
        if (args.id) {
            id = getItemId(args.id.fieldRef, args.id.valueType, args.id.value);
            //alert(id);
        };
        options.args = JSON.stringify(args);
        options.url = sal.globalConfig.siteUrl + '/Lists/' + config.listName + '/' + formName + '?ID=' + id +
            '&Source=' + location.pathname;

        SP.UI.ModalDialog.showModalDialog(options);
    }

    function showListView (filter) {
        // Redirect to the default sharepoint list view
        listUrl = sal.globalConfig.siteUrl + '/Lists/' + config.listName + '/AllItems.aspx' + filter;
        window.location.assign(listUrl);
    }

    function getListItems (caml) {
        // Return the items in the list (that match the query) in JSON format.
        var jsonResult = {};
        $().SPServices({
            operation: "GetListItems",
            CAMLQuery: caml,
            async: false,
            webURL: sal.globalConfig.siteUrl,
            listName: config.listName,
            CAMLViewFields: config.viewfield,
            completefunc: function (data, Status) {
                jsonResult = $(data.responseXML).SPFilterNode("z:row").SPXmlToJson({
                    mapping: {},
                    includeAllAttrs: true,
                    removeOws: true
                });
            }
        });

        return jsonResult;
    }


    function setListName (listName) {
        config.listName = listName;
    }

    function setViewfield (viewfield) {
        config.viewfield = viewfield;
    }

    function testConfig() {
        alert(config.listName);
    }

    var publicMembers = {
        showModal: function (formName, title, args, callback) {showModal(formName, title, args, callback)},
        setListName: function (listName) { setListName(listName) },
        showListView: function (filter) { showListView(filter) },
        getListItems: function (caml) { return getListItems(caml) },
        setViewfield: function (viewfield) { setViewfield(viewfield) },
        test: testConfig
    }

    return publicMembers;
}