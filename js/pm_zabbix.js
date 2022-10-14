// Макс. и мин. значение продолжительности неисправности на узле / раскраска ячеек длительности
let minCellValue = "";
let maxCellValue = "";

// Параметры fetch
const fetchOptions = {
  method: "GET",
};
const urlHosts = "https://10.224.138.11:9443/hosts";
const urlEvents = "https://10.224.138.11:9443/events_plain";

const gridOptions = {
  columnDefs: [
    {
      field: "group_name",
      headerName: "Группа",
      rowGroupIndex: 1,
      filter: "agTextColumnFilter",
    },
    {
      field: "groupid",
      headerName: "ID Группы",
      filter: "agTextColumnFilter",
    },
    {
      field: "name",
      headerName: "Полное наименование",
      hide: true,
      filter: "agTextColumnFilter",
    },
    {
      field: "hostid",
      headerName: "ID узла",
      filter: "agTextColumnFilter",
    },
    {
      field: "host_name",
      headerName: "Наименование узла",
      rowGroupIndex: 2,
      filter: "agTextColumnFilter",
    },
  ],
  defaultColDef: {
    flex: 1,
    filterable: true,
    sortable: true,
    resizable: true,
    enablePivot: true,
  },
  autoGroupColumnDef: {
    headerName: "Иерархия групп",
    filterable: true,
    minWidth: 200,
    cellRendererParams: {
      suppressCount: true,
      checkbox: true,
    },
  },

  onSelectionChanged: onSelectionChanged,

  animateRows: true,
  groupDefaultExpanded: 0,
  rowSelection: "multiple",
  suppressRowClickSelection: true,
  groupSelectsChildren: true,

  sideBar: {
    toolPanels: [
      {
        id: "filters",
        labelDefault: "Фильтры",
        labelKey: "filters",
        iconKey: "filter",
        toolPanel: "agFiltersToolPanel",
      },
    ],
    defaultToolPanel: "",
  },
  localeText: AG_GRID_LOCALE_RU,
};

const gridOptions1 = {
  columnDefs: [
    {
      field: "host_name",
      headerName: "Оборудование",
      rowGroupIndex: 1,
      filter: "agTextColumnFilter",
      pinned: "left",
      rowGroup: true,
      enableRowGroup: true,
      filter: true,
    },
    {
      field: "event_name",
      headerName: "Название события",
      filter: "agTextColumnFilter",
      pinned: "left",
      rowGroup: true,
      enableRowGroup: true,
      filter: true,
    },
    {
      field: "event_date",
      headerName: "Дата события",
      pivot: true,
    },
    {
      field: "end_date",
      headerName: "Дата отсчета",
    },
    {
      field: "duration_min",
      headerName: "Длительность, мин.",
      rowGroupIndex: 2,
      aggFunc: "sum",
      cellStyle: function (params) {
        if (params.value != null) {
          // Раскрашиваем ячейки в зав-сти. от их 'веса'. RGB красный - зеленый
          let deltaMaxMin = maxCellValue - minCellValue;
          if (deltaMaxMin == 0) deltaMaxMin = maxCellValue * 4;
          let weight = (params.value - minCellValue) / deltaMaxMin;
          let green = (1 - weight) * 155;
          let red = weight * 225;

          return {
            color: "white",
            backgroundColor: `rgb(${red}, ${green}, 15)`,
          };
        }
      },
    },
  ],
  defaultColDef: {
    flex: 1,
    minWidth: 140,
    filterable: true,
    sortable: true,
    resizable: true,
  },
  autoGroupColumnDef: {
    headerName: "Оборудование/кол-во. неисправностей",
    minWidth: 280,
    pinned: "left",
    cellRendererParams: {
      suppressCount: false,
      checkbox: false,
    },
  },

  suppressAggFuncInHeader: true,
  onSelectionChanged: onSelectionChanged,

  //debug: true,
  animateRows: true,
  groupDefaultExpanded: 0,
  rowSelection: "multiple",
  suppressRowClickSelection: true,
  groupSelectsChildren: true,
  sideBar: {
    toolPanels: [
      {
        id: "filters",
        labelDefault: "Фильтры",
        labelKey: "filters",
        iconKey: "filter",
        toolPanel: "agFiltersToolPanel",
      },
      {
        id: "columns",
        labelDefault: "Колонки",
        labelKey: "columns",
        iconKey: "columns",
        toolPanel: "agColumnsToolPanel",
      },
    ],
    defaultToolPanel: "",
  },
  localeText: AG_GRID_LOCALE_RU,
};

// Настройка грида после полной загрузки страницы
document.addEventListener("DOMContentLoaded", function () {
  var gridDiv = document.querySelector("#myGrid");
  new agGrid.Grid(gridDiv, gridOptions);

  var gridDiv1 = document.querySelector("#myGrid1");
  new agGrid.Grid(eventsGrid, gridOptions1);

  // Получаем хосты
  fetch(urlHosts, fetchOptions)
    .then((response) => response.json())
    .then((data) => gridOptions.api.setRowData(data.data))
    .catch((error) => console.log("error", error));

  // Получаем события
  (async () => {
    showEvents(urlEvents, fetchOptions).then();
  })();

  gridOptions.columnApi.setPivotMode(true);
  gridOptions1.columnApi.setPivotMode(true);
});

async function showEvents(url, options) {
  fetch(url, options)
    .then((response) => response.json())
    .then((data) => {
      //Вычисляем минимальное и максимальное значение длительности неисправности
      let values = data.data.map((ms) => ms.duration_min);
      values.sort((a, b) => a - b);
      minCellValue = values[0];
      maxCellValue = values[values.length - 1];

      // Возвращаем значения min, max в интерфейс
      document.getElementById("min_fail_time").innerHTML =
        minCellValue != undefined ? minCellValue : "-";
      document.getElementById("max_fail_time").innerHTML =
        maxCellValue != undefined ? maxCellValue : "-";

      gridOptions1.api.setRowData(data.data);
    })
    .catch((error) => console.log("error", error));
}

function onSelectionChanged() {
  const selectedRows = gridOptions.api.getSelectedRows();
  let paramsString = "";

  if (selectedRows != "") {
    paramsString = `?hosts=${selectedRows.map((row) => row.g_hostid).join()}`;
  }

  // Получаем события
  (async () => {
    showEvents(`${urlEvents}${paramsString}`, fetchOptions).then();
  })();
}

function exportExcel() {
  const params = {
    skipHeader: false,
    columnGroups: true,
    skipFooters: false,
    skipGroups: false,
    skipPinnedTop: false,
    skipPinnedBottom: false,
    allColumns: true,
    sheetName: "Отчёт",
    fileName: "Отчет по диагностике ВПУ",
  };

  params.processHeaderCallback = function (params) {
    return params.column.getColDef().headerName.toUpperCase();
  };

  gridOptions1.api.exportDataAsExcel(params);
}

function openNav(event) {
  event.preventDefault();
  if (document.body.clientWidth > 992)
    document.body.classList.remove("menu-collapsed");
  else document.getElementsByTagName("aside")[0].style.left = "0";
}

function closeNav(event) {
  event.preventDefault();
  if (document.body.clientWidth > 992)
    document.body.classList.add("menu-collapsed");
  else document.getElementsByTagName("aside")[0].style.left = "-280px";
}

let transformUX = function (event) {
  let resizeTimer = setTimeout(function () {
    if (document.body.clientWidth > 992) {
      document.body.classList.remove("menu-collapsed");
      document.getElementsByTagName("aside")[0].style.left = null;
    } else document.getElementsByTagName("aside")[0].style.left = "-280px";
  }, 100);
};

window.addEventListener("resize", transformUX, false);