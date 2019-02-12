jQuery.namespace('STRATEGY.User.MyPlan');

//Variable Declaration & Defination
var DefaultDateFormat;
var viewModelMyPlan;
var PagingMethodForPlanHistory = "viewModelMyPlan.PlanHistoryList";
var frameworkHelper = STRATEGY.Framework.Core;
var common = STRATEGY.Framework.Common;
var controllerUrl = "/User/";
var config = STRATEGY.Framework.Core.Config;
var orderbycolumn = null, orderby = null, currentPageNo = 1;
var UserAccount = {
    Active: "Activate",
    Trial: "Trial"
}
var orderbycolumn = '', orderby = '';
var UserModule = {
    GoalDeployment: "Goal Deployment",
    KPIDeployment: "KPI Deployment",
    Branding: "Branding"
}

STRATEGY.User.MyPlan.pageLoad = function () {
    viewModelMyPlan = new STRATEGY.User.MyPlan.pageViewModel();
    ko.applyBindings(viewModelMyPlan);
}


STRATEGY.User.viewModelPlanHistory = function (data, viewModel) {
    var self = this;
    var planName = '', startDate = '', endDate = '', totalAmount = 0.00, invoiceId = '', invoiceNumber = '', modules = '', userLimit = '', duration = '',paymentMethod;
    var installmentAmount = '', grandTotal = '', isFree=true;
    if (data != undefined) {
        planName = data.plan.PlanName;
        startDate = data.StartDate;
        endDate = data.EndDate;
        if (data.plan.Price != 0) {
            totalAmount = data.plan.Price;
        }
        else {
            totalAmount = "";
        }
        //invoiceId = data.invoice.InvoiceId;
        //invoiceNumber = data.invoice.InvoiceNumber
        if (data.invoice != null) {
            invoiceId = data.invoice.InvoiceId;
        }
        else {
            invoiceId;
        }
        if (data.invoice != null) {
            invoiceNumber = data.invoice.InvoiceNumber;
        }
        else {
            invoiceNumber = "NA";
        }
        if (data.plan.GoalDeployment == true) {
            modules = "Goal Deployment";
        }
        if (data.plan.KPIDeployment == true) {
            if (modules != "") {
                modules += ", KPI Deployment";
            }
            else {
                modules += "KPI Deployment"
            }
        }
        if (data.plan.Branding == true) {
            if (modules != "") {
                modules += ", Branding";
            }
            else {
                modules += "Branding";
            }
        }
        if (data.plan.IsLimitedUsers == true) {
            userLimit = data.plan.NoOfUsersInPlan;
        }
        else {
            userLimit = 'Unlimited';
        }
        installmentAmount = data.InstallmentAmount;
        grandTotal = data.TotalAmount;
        isFree = data.isFree;
        paymentMethod = data.PaymentMethod;
    }

    self.PlanName = ko.observable(planName);
    self.PaymentMethod = ko.observable(paymentMethod);
    self.StartDate = ko.observable(startDate == null ? null : dateFormat(common.ParsedJsonDate(startDate), "mm/dd/yyyy"));
    self.EndDate = ko.observable(endDate == null ? null : dateFormat(common.ParsedJsonDate(endDate), "mm/dd/yyyy"));
    self.TotalAmount = ko.observable(common.internationalDigitFormat(totalAmount));
    self.Modules = ko.observable(modules);
    self.UserLimit = ko.observable(userLimit);
    self.InvoiceId = ko.observable(invoiceId);
    self.ViewUrl = ko.observable("/Invoice/Detail/" + invoiceId);
    self.InvoiceNumber = ko.observable(invoiceNumber);
    self.Invoices = viewModel.RenderInvoice(data.InvoiceList);
    self.InstallmentAmount = ko.observable(installmentAmount);
    self.GrandTotal = ko.observable(common.internationalDigitFormat(common.ConvertToDecimal(data.TotalAmount)));
    self.IsFree = ko.observable(isFree);
}

STRATEGY.User.viewModelInvoice = function (data, viewModel) {
    var self = this;
    var invoiceId='', invoiceNumber = '', planStartDate = null, planEndDate = null, totalAmount =  '';
    if (data != undefined) {
        invoiceId = data.InvoiceId;
        invoiceNumber = data.InvoiceNumber;
        planStartDate = data.PlanStartDate;
        planEndDate = data.PlanEndDate;
        totalAmount = data.TotalAmount;
    }
    self.InvoiceId = invoiceId;
    self.InvoiceNumber = invoiceNumber;
    self.PlanStartDate = planStartDate == null ? null : dateFormat(common.ParsedJsonDate(planStartDate), "mm/dd/yyyy");
    self.PlanEndDate = planEndDate == null ? null : dateFormat(common.ParsedJsonDate(planEndDate), "mm/dd/yyyy");
    self.InvoiceViewUrl = "/Invoice/Detail/" + invoiceId;
    self.InvoiceNumber = invoiceNumber;
    self.TotalAmount = common.internationalDigitFormat(common.ConvertToDecimal(totalAmount));
}

//Table Header Model
STRATEGY.User.MyPlanHistoryHeaderViewModel = function (title, columnname, viewModel) {
    var self = this;
    self.ColumnText = ko.observable(title);
    self.ColumnName = ko.observable(columnname);
    if (columnname != "PaymentMethod") {
    self.SortOrder = ko.observable('sorting');
    self.Sort = viewModel.Sort;
    }
    else {
        self.SortOrder = ko.observable('no-cursor');
        self.Sort = null;
    }
}


//Page Model
STRATEGY.User.MyPlan.pageViewModel = function () {
    var self = this;
    self.IsInitialLoading = ko.observable(true);
    self.SelectedTrialPlan = ko.observable();
    self.ActiveNow = ko.observable(false);
    self.StartDate = ko.observable();
    self.EndDate = ko.observable();
    self.ShowCurrentPlanDetail = ko.observable(false);

    self.ShowAddPlanbtn = ko.observable(false);

    self.UserPlanId = ko.observable();
    self.UserPlanName = ko.observable();


    self.UserDescription = ko.observable();
    self.UserNoOfUserInPlan = ko.observable();

    self.HasGoalDeployment = ko.observable(false);
    self.HasKPIDeployment = ko.observable(false);
    self.HasBranding = ko.observable(false);
    self.GoalDeployment = ko.observable(false);
    self.KPIDeployment = ko.observable(false);
    self.Branding = ko.observable(false);


    self.MyPlanHistoryVMList = ko.observableArray();

    self.PlanHistoryList = function (currentPage) {
        var listingParameterMyPlanHistory = new Object();
        if (isNaN(currentPage)) {
            currentDate = 1;
        }
        listingParameterMyPlanHistory.CurrentPageNumber = currentPage;
        listingParameterMyPlanHistory.SortBy = orderbycolumn;
        listingParameterMyPlanHistory.SortOrder = orderby;
        STRATEGY.Framework.Core.getJSONDataBySearchParam(controllerUrl + "GetMyPlan", listingParameterMyPlanHistory, function onSuccess(response) {
            if (response.MyCurrentPlan.plan != null) {
                self.ShowCurrentPlanDetail(true);
                self.UserPlanId(response.MyCurrentPlan.plan.PlanId);
                self.UserPlanName(response.MyCurrentPlan.plan.PlanName);

                self.UserDescription(response.MyCurrentPlan.plan.Description);
                if (response.MyCurrentPlan.plan.IsLimitedUsers == true) {
                    self.UserNoOfUserInPlan(response.MyCurrentPlan.plan.NoOfUsersInPlan);
                }
                else {
                    self.UserNoOfUserInPlan("Unlimited");
                }
                self.Branding(response.MyCurrentPlan.plan.Branding);
                self.GoalDeployment(response.MyCurrentPlan.plan.GoalDeployment);
                self.KPIDeployment(response.MyCurrentPlan.plan.KPIDeployment);
                //self.HasGoalDeployment(response.Previousplan.plan.GoalDeployment);
                //    self.HasKPIDeployment(response.Previousplan.plan.KPIDeployment);
                //    self.HasBranding( response.Previousplan.plan.Branding);

                var startDate = (dateFormat(STRATEGY.Framework.Common.ParsedJsonDate(response.MyCurrentPlan.StartDate), "mm/dd/yyyy"));
                var endDate = (dateFormat(STRATEGY.Framework.Common.ParsedJsonDate(response.MyCurrentPlan.EndDate), "mm/dd/yyyy"));
                self.StartDate(startDate);
                self.EndDate(endDate);
                //self.UserInfo.PlanId(response.MyCurrentPlan.plan.PlanId);
                self.ShowAddPlanbtn(false);
            }
            else {
                self.ShowCurrentPlanDetail(false);
                self.ShowAddPlanbtn(true);
            }
            self.RenderMyPlanHistoryList(response.MyPlanHistoryList);
            // self.IsPaymentGatewayFetched(1);

            $("._PlanHistoryPager").html(self.GetPaging(response.TotalRecords, currentPage, PagingMethodForPlanHistory, "PlanHistoryPager"));
            currentPageNo = currentPage;
            self.IsInitialLoading(false);
        }, function onError(err) {

            self.status(err.Message);
        });

    }
    self.GetPaging = function (Rowcount, currentPage, methodName, uniqueMethodName) {
        return STRATEGY.Framework.Core.GetPagger(Rowcount, currentPage, methodName, uniqueMethodName);
    }

    self.RenderMyPlanHistoryList = function (DataList) {
        self.MyPlanHistoryVMList.removeAll();
        ko.utils.arrayForEach(DataList, function (Plan) {
            self.MyPlanHistoryVMList.push(new STRATEGY.User.viewModelPlanHistory(Plan, self));
        });
    }
    self.RenderPlanHistroyListTableHeaders = function () {
        self.PlanHistoryListTableHeaders.removeAll();
        self.PlanHistoryListTableHeaders.push(new STRATEGY.User.MyPlanHistoryHeaderViewModel("Plan Type", "PlanName", self));
        self.PlanHistoryListTableHeaders.push(new STRATEGY.User.MyPlanHistoryHeaderViewModel("Start Date", "StartDate", self));
        self.PlanHistoryListTableHeaders.push(new STRATEGY.User.MyPlanHistoryHeaderViewModel("End Date", "EndDate", self));
        self.PlanHistoryListTableHeaders.push(new STRATEGY.User.MyPlanHistoryHeaderViewModel("Payment Method", "PaymentMethod", self));
        self.PlanHistoryListTableHeaders.push(new STRATEGY.User.MyPlanHistoryHeaderViewModel("Amount", "TotalAmount", self));

    }
    //self.Sort = function (col) {
    //    if (col.ColumnName() != "Action") {
    //        ko.utils.arrayFirst(self.PlanHistoryListTableHeaders(), function (item) {
    //            //if (item.ColumnName() != col.ColumnName() && item.ColumnName() != "PaymentStatus" && item.ColumnName() != "InvoiceStatus" && item.ColumnName() != "FullName") {
    //            //item.SortOrder('sorting');
    //            //}
    //        });
    //        if (col.SortOrder() == 'sorting_asc') {
    //            col.SortOrder('sorting_desc');
    //        }
    //        else {
    //            col.SortOrder('sorting_asc');
    //        }
    //        orderbycolumn = col.ColumnName();
    //        orderby = col.SortOrder() == 'sorting_asc' ? 'asc' : 'desc';
    //        self.PlanHistoryList(1);//currentPageNo
    //    }
    //}

    self.RenderInvoice = function (invoiceList) {
        var invoiceListToReturn = new Array();
        ko.utils.arrayFirst(invoiceList, function (invoice) {
            invoiceListToReturn.push(new STRATEGY.User.viewModelInvoice(invoice, self));
        });
        return invoiceListToReturn;
    }

    self.KOSort = function (kpilist, orderby) {
    
        kpilist.sort(function (left, right) {
         
            switch (orderbycolumn) {      
                case "PlanName":
                    if (orderby == "asc") {
                        return (left.PlanName().toLowerCase() < right.PlanName().toLowerCase() ? -1 : 1);
                    }
                    else {
                        return (left.PlanName().toLowerCase() > right.PlanName().toLowerCase() ? -1 : 1);
                    }
                    break;
                case "StartDate":
                    if (orderby == "asc") {
                        return (left.StartDate().toLowerCase() < right.StartDate().toLowerCase() ? -1 : 1);
                    }
                    else {
                        return (left.StartDate().toLowerCase() > right.StartDate().toLowerCase() ? -1 : 1);
                    }
                    break;
                case "EndDate":
                    if (orderby == "asc") {
                        return (left.EndDate().toLowerCase() < right.EndDate().toLowerCase() ? -1 : 1);
                    }
                    else {
                        return (left.EndDate().toLowerCase() > right.EndDate().toLowerCase() ? -1 : 1);
                    }
                    break;
                case "TotalAmount":
                    if (orderby == "asc") {
                        return (left.GrandTotal() < right.GrandTotal() ? -1 : 1);
                    }
                    else {
                        return (left.GrandTotal() > right.GrandTotal() ? -1 : 1);
                    }
                    break;
            }
        });
    }
    self.Sort = function (col) {
            ko.utils.arrayFirst(self.PlanHistoryListTableHeaders(), function (item) {
                if (item.ColumnName() != col.ColumnName()) {
                    if (item.ColumnName() != "PaymentMethod") {
                        item.SortOrder('sorting');
                    } else {
                        item.SortOrder('no-cursor');
                    }
                }
            });
            if (col.SortOrder() == 'sorting_asc') {
                col.SortOrder('sorting_desc');
            }
            else {
                col.SortOrder('sorting_asc');
            }
            orderbycolumn = col.ColumnName();
            orderby = col.SortOrder() == 'sorting_asc' ? 'asc' : 'desc';
            self.KOSort(self.MyPlanHistoryVMList, orderby);
    }

    self.PlanHistoryListTableHeaders = ko.observableArray([]);
    self.RenderPlanHistroyListTableHeaders();
    self.MyPlanHistoryList = ko.observableArray();
    self.PlanHistoryList(1);






}