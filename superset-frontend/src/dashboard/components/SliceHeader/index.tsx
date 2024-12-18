import { FC, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { css, getExtensionsRegistry, styled, t } from '@superset-ui/core';
import { useUiConfig } from 'src/components/UiConfigContext';
import { Tooltip } from 'src/components/Tooltip';
import { useSelector } from 'react-redux';
import EditableTitle from 'src/components/EditableTitle';
import SliceHeaderControls, {
  SliceHeaderControlsProps,
} from 'src/dashboard/components/SliceHeaderControls';
import FiltersBadge from 'src/dashboard/components/FiltersBadge';
import Icons from 'src/components/Icons';
import { RootState } from 'src/dashboard/types';
import { getSliceHeaderTooltip } from 'src/dashboard/util/getSliceHeaderTooltip';
import { DashboardPageIdContext } from 'src/dashboard/containers/DashboardPage';
import { Modal } from 'antd';
import ReactMarkdown from "react-markdown";

const extensionsRegistry = getExtensionsRegistry();

type SliceHeaderProps = SliceHeaderControlsProps & {
  innerRef?: string;
  updateSliceName?: (arg0: string) => void;
  editMode?: boolean;
  annotationQuery?: object;
  annotationError?: object;
  sliceName?: string;
  filters: object;
  handleToggleFullSize: () => void;
  formData: object;
  width: number;
  height: number;
};

const annotationsLoading = t('Annotation layers are still loading.');
const annotationsError = t('One or more annotation layers failed loading.');
const CrossFilterIcon = styled(Icons.ApartmentOutlined)`
  ${({ theme }) => `
    cursor: default;
    color: ${theme.colors.primary.base};
    line-height: 1.8;
  `}
`;

const ChartHeaderStyles = styled.div`
  ${({ theme }) => css`
    font-size: ${theme.typography.sizes.l}px;
    font-weight: ${theme.typography.weights.bold};
    margin-bottom: ${theme.gridUnit}px;
    display: flex;
    max-width: 100%;
    align-items: flex-start;
    min-height: 0;

    & > .header-title {
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
      flex-grow: 1;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;

      & > span.antd5-tooltip-open {
        display: inline;
      }
    }

    & > .header-controls {
      display: flex;
      align-items: center;
      height: 24px;

      & > * {
        margin-left: ${theme.gridUnit * 2}px;
      }
    }

    .dropdown.btn-group {
      pointer-events: none;
      vertical-align: top;
      & > * {
        pointer-events: auto;
      }
    }

    .dropdown-toggle.btn.btn-default {
      background: none;
      border: none;
      box-shadow: none;
    }

    .dropdown-menu.dropdown-menu-right {
      top: ${theme.gridUnit * 5}px;
    }

    .divider {
      margin: ${theme.gridUnit}px 0;
    }

    .refresh-tooltip {
      display: block;
      height: ${theme.gridUnit * 4}px;
      margin: ${theme.gridUnit}px 0;
      color: ${theme.colors.text.label};
    }
  `}
`;

const SliceHeader: FC<SliceHeaderProps> = ({
  innerRef = null,
  forceRefresh = () => ({}),
  updateSliceName = () => ({}),
  toggleExpandSlice = () => ({}),
  logExploreChart = () => ({}),
  logEvent,
  exportCSV = () => ({}),
  exportXLSX = () => ({}),
  editMode = false,
  annotationQuery = {},
  annotationError = {},
  cachedDttm = null,
  updatedDttm = null,
  isCached = [],
  isExpanded = false,
  sliceName = '',
  supersetCanExplore = false,
  supersetCanShare = false,
  supersetCanCSV = false,
  exportPivotCSV,
  exportFullCSV,
  exportFullXLSX,
  slice,
  componentId,
  dashboardId,
  addSuccessToast,
  addDangerToast,
  handleToggleFullSize,
  isFullSize,
  chartStatus,
  formData,
  width,
  height,
}) => {
  const SliceHeaderExtension = extensionsRegistry.get('dashboard.slice.header');
  const uiConfig = useUiConfig();
  const dashboardPageId = useContext(DashboardPageIdContext);
  const [headerTooltip, setHeaderTooltip] = useState<ReactNode | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const [apiData, setApiData] = useState<string>(''); 
  const [loading, setLoading] = useState(false); 

  // TODO: change to indicator field after it will be implemented
  const crossFilterValue = useSelector<RootState, any>(
    state => state.dataMask[slice?.slice_id]?.filterState?.value,
  );
  const isCrossFiltersEnabled = useSelector<RootState, boolean>(
    ({ dashboardInfo }) => dashboardInfo.crossFiltersEnabled,
  );

  const canExplore = !editMode && supersetCanExplore;

  useEffect(() => {
    const headerElement = headerRef.current;
    if (canExplore) {
      setHeaderTooltip(getSliceHeaderTooltip(sliceName));
    } else if (
      headerElement &&
      (headerElement.scrollWidth > headerElement.offsetWidth ||
        headerElement.scrollHeight > headerElement.offsetHeight)
    ) {
      setHeaderTooltip(sliceName ?? null);
    } else {
      setHeaderTooltip(null);
    }
  }, [sliceName, width, height, canExplore]);

  const exploreUrl = `/explore/?dashboard_page_id=${dashboardPageId}&slice_id=${slice.slice_id}`;

  const handleTooltipClick = () => {
    setModalVisible(true);
    fetchData();
  };

  const handleModalClose = () => {
    setModalVisible(false);
  };

  // const params = {
  //   chart_title: "Sales Distribution",
  //   chart_description: "Distribution of sales across regions",
  //   data: [
  //   	  {region: "North", sales: 100},
  //       {region: "South", sales: 150},
  //       {region: "East", sales: 75}
  //     ],
  //   visualization_type: "Pie",
  //   x_axis: "Region",
  //   y_axis: "Sales"
  // };

  // const fetchData = async () => {
  //   setLoading(true); 
  //   try {  
  //     const response = await fetch('https://10.184.0.61/backend/insight/generate', {
  //     // const response = await fetch('/api/v1/chart/data', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify(params),
  //       mode: 'no-cors',
  //     });
  
  //     if (!response.ok) {
  //       throw new Error('Gagal mengambil data');
  //     }
  
  //     const result = await response.json(); 
  //     console.log('Response Data:', result);
  
  //     setApiData(result || 'Data tidak tersedia'); 

  //   } catch (error) {
  //     console.error('Error:', error);
  //     setApiData('Terjadi kesalahan saat mengambil data.');
  //   } finally {
  //     setLoading(false); 
  //   }
  // };

  const fetchData = async () => {
    setLoading(true); 
    try {
      const params = {
        "chart_title": "Sales Distribution",
        "chart_description": "Distribution of sales across regions",
        "data": [
          {"region": "North", "sales": 100},
            {"region": "South", "sales": 150},
            {"region": "East", "sales": 75}
          ],
          "visualization_type": "Pie",
          "x_axis": "Region",
          "y_axis": "Sales"
        };
      
      const response = await fetch('https://10.184.0.61/backend/insight/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
        mode: 'no-cors',
      });
  
      if (!response.ok) {
        throw new Error('Gagal mengambil data');
      }
  
      const result = await response.json(); 
      console.log('Response Data:', result);
  
      setApiData(result || 'Data tidak tersedia'); 
  
    } catch (error) {
      console.error('Error:', error);
      setApiData('Terjadi kesalahan saat mengambil data.');
    } finally {
      setLoading(false); 
    }
  };
  

  // Fetch data dari API saat modal dibuka
  // const fetchData = async () => {
  //   setLoading(true);
  //   try {
  //     const response = await fetch('/api/v1/chart/data', {
  //       method: 'GET',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //     });
  //     if (!response.ok) {
  //       throw new Error('Gagal mengambil data');
  //     }
  //     const result = await response.json();
  //     setApiData(result.data || 'Data tidak tersedia');
  //   } catch (error) {
  //     setApiData('Terjadi kesalahan saat mengambil data.');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const payload = {
  //   message: "Success",
  //   data: `Dari grafik Monthly Revenue untuk tahun 2024, 
  //           terlihat bahwa pendapatan bulanan mengalami 
  //           peningkatan dari bulan Januari hingga Maret. 
  //           Namun, peningkatan tersebut tidak terlalu signifikan 
  //           antara bulan Februari dan Maret.\n\nPotensi masalah yang terlihat 
  //           dalam grafik ini adalah bahwa hanya terdapat data untuk 3 bulan pertama tahun 2024. 
  //           Hal ini membuat sulit untuk melihat tren pendapatan secara 
  //           keseluruhan selama tahun tersebut. Sebaiknya data untuk bulan-bulan selanjutnya 
  //           juga ditambahkan agar dapat memberikan gambaran yang lebih lengkap.\n\nAnomali yang 
  //           terlihat adalah peningkatan pendapatan yang tidak konsisten antara 
  //           bulan Februari dan Maret. Hal ini bisa disebabkan oleh faktor-faktor 
  //           seperti perubahan strategi pemasaran, fluktuasi pasar, atau perubahan 
  //           dalam kebijakan harga. Sebaiknya dilakukan analisis lebih lanjut untuk memahami penyebab dari anomali tersebut.`,
  //   status: 200,
  // };

  return (
    <ChartHeaderStyles data-test="slice-header" ref={innerRef}>
      <div className="header-title" ref={headerRef}>
        <Tooltip title={headerTooltip}>
          <EditableTitle
            title={
              sliceName ||
              (editMode
                ? '---' // this makes an empty title clickable
                : '')
            }
            canEdit={editMode}
            onSaveTitle={updateSliceName}
            showTooltip={false}
            url={canExplore ? exploreUrl : undefined}
          />
        </Tooltip>
        {!!Object.values(annotationQuery).length && (
          <Tooltip
            id="annotations-loading-tooltip"
            placement="top"
            title={annotationsLoading}
          >
            <i
              role="img"
              aria-label={annotationsLoading}
              className="fa fa-refresh warning"
            />
          </Tooltip>
        )}
        {!!Object.values(annotationError).length && (
          <Tooltip
            id="annotation-errors-tooltip"
            placement="top"
            title={annotationsError}
          >
            <i
              role="img"
              aria-label={annotationsError}
              className="fa fa-exclamation-circle danger"
            />
          </Tooltip>
        )}
      </div>
      <div className="header-tooltip">
        <button onClick={handleTooltipClick} className="chart-tooltip"
        style={{
          border: 'none',
          background: 'none',
          padding: '0', 
          margin: '0', 
        }}>
          <i
            className="fas fa-lightbulb"
            title="This chart provides additional insights."
            style={{
              marginLeft: '8px',
              marginTop: '7px',
              cursor: 'pointer',
              color: '#888',
              fontSize: '16px',
            }}
          ></i>
        </button>
      </div>
      <div className="header-controls">
        {!editMode && (
          <>
            {SliceHeaderExtension && (
              <SliceHeaderExtension
                sliceId={slice.slice_id}
                dashboardId={dashboardId}
              />
            )}
            {crossFilterValue && (
              <Tooltip
                placement="top"
                title={t(
                  'This chart applies cross-filters to charts whose datasets contain columns with the same name.',
                )}
              >
                <CrossFilterIcon iconSize="m" />
              </Tooltip>
            )}
            {!uiConfig.hideChartControls && (
              <FiltersBadge chartId={slice.slice_id} />
            )}
            {!uiConfig.hideChartControls && (
              <SliceHeaderControls
                slice={slice}
                isCached={isCached}
                isExpanded={isExpanded}
                cachedDttm={cachedDttm}
                updatedDttm={updatedDttm}
                toggleExpandSlice={toggleExpandSlice}
                forceRefresh={forceRefresh}
                logExploreChart={logExploreChart}
                logEvent={logEvent}
                exportCSV={exportCSV}
                exportPivotCSV={exportPivotCSV}
                exportFullCSV={exportFullCSV}
                exportXLSX={exportXLSX}
                exportFullXLSX={exportFullXLSX}
                supersetCanExplore={supersetCanExplore}
                supersetCanShare={supersetCanShare}
                supersetCanCSV={supersetCanCSV}
                componentId={componentId}
                dashboardId={dashboardId}
                addSuccessToast={addSuccessToast}
                addDangerToast={addDangerToast}
                handleToggleFullSize={handleToggleFullSize}
                isFullSize={isFullSize}
                isDescriptionExpanded={isExpanded}
                chartStatus={chartStatus}
                formData={formData}
                exploreUrl={exploreUrl}
                crossFiltersEnabled={isCrossFiltersEnabled}
              />
            )}
          </>
        )}
      </div>
      {modalVisible && (
        <Modal
          title="Chart Insights"
          visible={modalVisible}
          onCancel={handleModalClose}
          footer={null}
        >
          {loading ? (
            <p>Loading...</p>
          ) : (
            <ReactMarkdown>{apiData}</ReactMarkdown>
          )}
          {/* Add your modal content here */}
        </Modal>
      )}
    </ChartHeaderStyles>
  );
};

export default SliceHeader;
