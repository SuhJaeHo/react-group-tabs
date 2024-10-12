import React, { useRef, useReducer, useEffect, useContext, useMemo, useState } from "react";
import boardLayoutReducer, { boardLayoutInitialState, BoardLayoutDispatchContext, BoardLayoutStateContext } from "./boardLayoutReducer";
import boardDataReducer, { BoardDataDispatchContext, BoardDataStateContext } from "./boardDataReducer";

import { cn, getGroupElementBoundaryPositions, getGroupTabsNewIdList, getTabMoveStatus, handleTabJoinGroup, handleTabLeaveGroup, resetGroupTabsTranslate, setGroupElementInFront } from "./utils";

import { CUSTOM_ZINDEX, RESIZE_DIRECTIONS, TAB_MOVE_STATUS, TAB_TRANSLATE_STATUS, TAB_SIZE, GROUP_MIN_SIZE } from "./constants";

import { BoardDataContextType, IGroup, IPosition, IGroupHeaderProps, ITabProps, IGroupIndicate } from "./types";
import { cva } from "class-variance-authority";

const Provider = ({ data, children }: { data: BoardDataContextType; children: React.ReactNode }) => {
  const [boardLayoutState, boardLayoutDispatch] = useReducer(boardLayoutReducer, boardLayoutInitialState);
  const [boardDataState, boardDataDispatch] = useReducer(boardDataReducer, data);
  return (
    <BoardLayoutDispatchContext.Provider value={boardLayoutDispatch}>
      <BoardLayoutStateContext.Provider value={boardLayoutState}>
        <BoardDataDispatchContext.Provider value={boardDataDispatch}>
          <BoardDataStateContext.Provider value={boardDataState}>{children}</BoardDataStateContext.Provider>
        </BoardDataDispatchContext.Provider>
      </BoardLayoutStateContext.Provider>
    </BoardLayoutDispatchContext.Provider>
  );
};

const Container = ({ children }: { children: React.ReactNode }) => {
  const boardLayoutDispatch = useContext(BoardLayoutDispatchContext);
  const boardDataDispatch = useContext(BoardDataDispatchContext);
  const boardDataContext = useContext(BoardDataStateContext);

  const [groupIndicate, setGroupIndicate] = useState<null | IGroupIndicate>(null);

  const boardDataContextRef = useRef(boardDataContext);
  const groupIndicateRef = useRef<null | IGroupIndicate>(null);
  const containerRef = useRef<React.ElementRef<"div"> | null>(null);

  useEffect(() => {
    groupIndicateRef.current = groupIndicate;
  }, [groupIndicate]);

  useEffect(() => {
    boardDataContextRef.current = boardDataContext;
  }, [boardDataContext]);

  const handleMouseMoveContainer = (e: MouseEvent) => {
    if (!containerRef.current) return;
    const { offsetTop: containerTop, offsetLeft: containerLeft, offsetHeight: containerHeight, offsetWidth: containerWidth } = containerRef.current;

    /**
     * Resize
     */
    const resizeHandlerElement = document.querySelector("[data-resize-handler-is-dragging=true]");
    if (resizeHandlerElement) {
      const dataPos = resizeHandlerElement.getAttribute("data-position");
      const dataDir = resizeHandlerElement.getAttribute("data-direction");
      const dataGroupId = resizeHandlerElement.getAttribute("data-group-id");
      if (dataPos && dataDir && dataGroupId) {
        const pos = JSON.parse(dataPos) as IPosition;
        const dir = dataDir as keyof typeof RESIZE_DIRECTIONS;

        const groupElement = document.getElementById(dataGroupId);
        if (groupElement) {
          const dx = e.clientX - pos.x;
          const dy = e.clientY - pos.y;

          const { offsetTop: groupTop, offsetLeft: groupLeft, offsetHeight: groupHeight, offsetWidth: groupWidth } = groupElement;

          const { minTop, minLeft, maxLeft } = getGroupElementBoundaryPositions(containerRef as any, groupElement);

          const handleResizeTopDirection = () => {
            if (groupHeight - dy < GROUP_MIN_SIZE.HEIGHT) {
              groupElement.style.top = `${groupTop + (groupHeight - GROUP_MIN_SIZE.HEIGHT)}px`;
              groupElement.style.height = `${GROUP_MIN_SIZE.HEIGHT}px`;
              pos.y = containerTop + groupTop + groupHeight - GROUP_MIN_SIZE.HEIGHT;
            } else if (groupTop + dy <= minTop) {
              groupElement.style.top = `${minTop}px`;
              groupElement.style.height = `${groupHeight + groupTop}px`;
              pos.y = containerTop;
            } else {
              groupElement.style.top = `${groupTop + dy}px`;
              groupElement.style.height = `${groupHeight - dy}px`;
              pos.y = e.clientY;
            }
          };

          const handleResizeBottomDirection = () => {
            if (groupHeight + dy < GROUP_MIN_SIZE.HEIGHT) {
              groupElement.style.height = `${GROUP_MIN_SIZE.HEIGHT}px`;
              pos.y = containerTop + groupTop + GROUP_MIN_SIZE.HEIGHT;
            } else if (groupHeight + dy >= containerHeight - groupTop) {
              groupElement.style.height = `${containerHeight - groupTop}px`;
              pos.y = containerTop + containerHeight;
            } else {
              groupElement.style.height = `${groupHeight + dy}px`;
              pos.y = e.clientY;
            }
          };

          const handleResizeLeftDirection = () => {
            if (groupWidth - dx < GROUP_MIN_SIZE.WIDTH) {
              groupElement.style.left = `${groupLeft + (groupWidth - GROUP_MIN_SIZE.WIDTH)}px`;
              groupElement.style.width = `${GROUP_MIN_SIZE.WIDTH}px`;
              pos.x = containerLeft + groupLeft + groupWidth - GROUP_MIN_SIZE.WIDTH;
            } else if (groupLeft + dx <= minLeft) {
              groupElement.style.left = `${minLeft}px`;
              groupElement.style.width = `${groupLeft + groupWidth}px`;
              pos.x = containerLeft;
            } else {
              groupElement.style.left = `${groupLeft + dx}px`;
              groupElement.style.width = `${groupWidth - dx}px`;
              pos.x = e.clientX;
            }
          };

          const handleResizeRightDirection = () => {
            if (groupWidth + dx < GROUP_MIN_SIZE.WIDTH) {
              groupElement.style.width = `${GROUP_MIN_SIZE.WIDTH}px`;
              pos.x = containerLeft + groupLeft + GROUP_MIN_SIZE.WIDTH;
            } else if (groupLeft + dx >= maxLeft) {
              groupElement.style.width = `${containerWidth - groupLeft}px`;
              pos.x = containerLeft + containerWidth;
            } else {
              groupElement.style.width = `${groupWidth + dx}px`;
              pos.x = e.clientX;
            }
          };

          if (dir === RESIZE_DIRECTIONS.Top) {
            handleResizeTopDirection();
          } else if (dir === RESIZE_DIRECTIONS.Bottom) {
            handleResizeBottomDirection();
          } else if (dir === RESIZE_DIRECTIONS.Left) {
            handleResizeLeftDirection();
          } else if (dir === RESIZE_DIRECTIONS.Right) {
            handleResizeRightDirection();
          } else if (dir === RESIZE_DIRECTIONS.TopLeft) {
            handleResizeTopDirection();
            handleResizeLeftDirection();
          } else if (dir === RESIZE_DIRECTIONS.TopRight) {
            handleResizeTopDirection();
            handleResizeRightDirection();
          } else if (dir === RESIZE_DIRECTIONS.BottomLeft) {
            handleResizeBottomDirection();
            handleResizeLeftDirection();
          } else {
            handleResizeBottomDirection();
            handleResizeRightDirection();
          }

          resizeHandlerElement.setAttribute("data-position", JSON.stringify(pos));
        }
      }

      return;
    }

    /**
     * Tab Move
     */
    const currTabElement = document.querySelector("[data-tab-is-dragging=true]") as HTMLElement;
    if (currTabElement && boardLayoutDispatch) {
      const pos = JSON.parse(currTabElement.getAttribute("data-position") as string) as IPosition;
      const currGroupId = currTabElement.getAttribute("data-group-id") as string;

      const currGroupElement = document.getElementById(currGroupId);
      if (!currGroupElement) return;

      const dx = e.clientX - pos.x;
      const dy = e.clientY - pos.y;
      pos.x = e.clientX;
      pos.y = e.clientY;
      currTabElement.setAttribute("data-position", JSON.stringify(pos));

      currTabElement.style.top = `${currTabElement.offsetTop + dy}px`;
      currTabElement.style.left = `${currTabElement.offsetLeft + dx}px`;

      const tabMoveStatus = getTabMoveStatus(currTabElement);
      currTabElement.setAttribute("data-tab-move-status", tabMoveStatus);

      if (tabMoveStatus === TAB_MOVE_STATUS.Divided) {
        boardLayoutDispatch({
          type: "UPDATE_TAB_INDICATOR",
          payload: {
            groupId: "",
            tabIdx: 0,
          },
        });

        const { minTop, maxTop, minLeft, maxLeft } = getGroupElementBoundaryPositions(containerRef as any, currGroupElement);
        const { offsetTop: containerTop, offsetWidth: containerWidth, offsetHeight: containerHeight } = containerRef.current;

        if (e.clientY <= containerTop) {
          setGroupIndicate({
            position: {
              x: minLeft,
              y: 0,
            },
            size: { width: containerWidth, height: containerHeight / 2 },
          });
        } else if (e.clientY >= containerTop + containerHeight) {
          setGroupIndicate({
            position: {
              x: minLeft,
              y: containerHeight / 2,
            },
            size: { width: containerWidth, height: containerHeight / 2 },
          });
        } else if (e.clientX <= containerLeft) {
          setGroupIndicate({
            position: {
              x: minLeft,
              y: 0,
            },
            size: { width: containerWidth / 2, height: containerHeight },
          });
        } else if (e.clientX >= containerLeft + containerWidth) {
          setGroupIndicate({
            position: {
              x: containerWidth / 2,
              y: 0,
            },
            size: { width: containerWidth / 2, height: containerHeight },
          });
        } else {
          let dx = e.clientX - containerLeft;
          let dy = e.clientY - containerTop;
          if (dx > maxLeft) dx = maxLeft;
          if (dx < minLeft) dx = minLeft;
          if (dy > maxTop) dy = maxTop;
          if (dy < minTop) dy = minTop;
          setGroupIndicate({
            position: {
              x: dx,
              y: dy,
            },
            size: { width: currGroupElement.offsetWidth, height: currGroupElement.offsetHeight },
          });
        }

        const combineGroupId = currTabElement.getAttribute("data-tab-combine-group-id") as string;
        const combineGroupElement = document.getElementById(combineGroupId);
        if (combineGroupId.length > 0 && combineGroupElement) {
          handleTabLeaveGroup(combineGroupElement, currTabElement);
          currTabElement.setAttribute("data-tab-combine-group-id", "");
          currTabElement.setAttribute("data-tab-prev-combine-group-id", "");
          currTabElement.setAttribute("data-tab-is-combine", "false");
          const isCurrTabDivided = JSON.parse(currTabElement.getAttribute("data-tab-is-divided") as string) as boolean;
          if (!isCurrTabDivided) {
            currTabElement.setAttribute("data-tab-is-divided", "true");
          }
        }

        const isCurrTabDivided = JSON.parse(currTabElement.getAttribute("data-tab-is-divided") as string) as boolean;
        if (!isCurrTabDivided) {
          handleTabLeaveGroup(currGroupElement, currTabElement);
          currTabElement.setAttribute("data-tab-is-divided", "true");
        }
      } else if (tabMoveStatus === TAB_MOVE_STATUS.Combine) {
        setGroupIndicate(null);

        const prevCombineGroupId = currTabElement.getAttribute("data-tab-prev-combine-group-id") as string;
        const combineGroupId = currTabElement.getAttribute("data-tab-combine-group-id") as string;

        if (prevCombineGroupId !== combineGroupId) {
          if (prevCombineGroupId.length > 0) {
            const prevCombineGroupElement = document.getElementById(prevCombineGroupId);
            if (prevCombineGroupElement) {
              handleTabLeaveGroup(prevCombineGroupElement, currTabElement);
            }
          } else {
            currTabElement.setAttribute("data-tab-is-combine", "true");

            const isCurrTabDivided = JSON.parse(currTabElement.getAttribute("data-tab-is-divided") as string) as boolean;
            if (!isCurrTabDivided) {
              handleTabLeaveGroup(currGroupElement, currTabElement);
            } else {
              currTabElement.setAttribute("data-tab-is-divided", "false");
            }
          }

          const combineGroupElement = document.getElementById(combineGroupId);
          if (combineGroupElement) {
            handleTabJoinGroup(combineGroupElement, currTabElement);
          }

          currTabElement.setAttribute("data-tab-prev-combine-group-id", combineGroupId);
          setGroupElementInFront(combineGroupId);

          const currTabIdx = currTabElement.getAttribute("data-tab-idx") as string;
          boardLayoutDispatch({
            type: "UPDATE_TAB_INDICATOR",
            payload: {
              groupId: combineGroupId,
              tabIdx: Number(currTabIdx),
            },
          });
        } else {
          const currTabIdx = JSON.parse(currTabElement.getAttribute("data-tab-idx") as string) as number;
          const combineGroupId = currTabElement.getAttribute("data-tab-combine-group-id") as string;

          const combineGroupElement = document.getElementById(combineGroupId);
          if (!combineGroupElement) return;

          let currTabNewIdx = Math.floor(
            (currTabElement.getBoundingClientRect().left - combineGroupElement.getBoundingClientRect().left + currTabElement.offsetWidth / 2) / currTabElement.offsetWidth
          );
          const combineGroupTabCnts = boardDataContextRef.current.group[combineGroupId].tabIds.length;
          if (currTabNewIdx >= combineGroupTabCnts) currTabNewIdx = combineGroupTabCnts;
          if (currTabNewIdx <= 0) currTabNewIdx = 0;
          if (currTabNewIdx === currTabIdx) return;

          if (currTabIdx > currTabNewIdx) {
            // move left way
            for (let i = currTabIdx - 1; i >= currTabNewIdx; i--) {
              const tabElement = combineGroupElement.querySelector(`[data-tab-idx="${i}"]`);
              if (tabElement instanceof HTMLElement) {
                tabElement.setAttribute("data-tab-idx", JSON.stringify(i + 1));
                const dataTabTranslateStatus = tabElement.getAttribute("data-tab-translate-status") as string;
                if (dataTabTranslateStatus === TAB_TRANSLATE_STATUS.Default) {
                  tabElement.style.transform = `translate(${currTabElement.offsetWidth}px, 0px)`;
                  tabElement.setAttribute("data-tab-translate-status", TAB_TRANSLATE_STATUS.Right);
                } else if (dataTabTranslateStatus === TAB_TRANSLATE_STATUS.Left) {
                  tabElement.style.transform = "translate(0px, 0px)";
                  tabElement.setAttribute("data-tab-translate-status", TAB_TRANSLATE_STATUS.Default);
                }
              }
            }
          } else {
            // move right way
            for (let i = currTabIdx + 1; i <= currTabNewIdx; i++) {
              const tabElement = combineGroupElement.querySelector(`[data-tab-idx="${i}"]`);
              if (tabElement instanceof HTMLElement) {
                tabElement.setAttribute("data-tab-idx", JSON.stringify(i - 1));
                const dataTabTranslateStatus = tabElement.getAttribute("data-tab-translate-status") as string;
                if (dataTabTranslateStatus === TAB_TRANSLATE_STATUS.Default) {
                  tabElement.style.transform = `translate(${-currTabElement.offsetWidth}px, 0px)`;
                  tabElement.setAttribute("data-tab-translate-status", TAB_TRANSLATE_STATUS.Left);
                } else if (dataTabTranslateStatus === TAB_TRANSLATE_STATUS.Left) {
                } else {
                  tabElement.style.transform = "translate(0px, 0px)";
                  tabElement.setAttribute("data-tab-translate-status", TAB_TRANSLATE_STATUS.Default);
                }
              }
            }
          }

          currTabElement.setAttribute("data-tab-idx", JSON.stringify(currTabNewIdx));
          boardLayoutDispatch({
            type: "UPDATE_TAB_INDICATOR",
            payload: {
              groupId: combineGroupId,
              tabIdx: Number(currTabNewIdx),
            },
          });
        }
      } else {
        setGroupIndicate(null);

        setGroupElementInFront(currGroupId);

        const isCurrTabCombine = JSON.parse(currTabElement.getAttribute("data-tab-is-combine") as string) as boolean;
        const isCurrTabDivided = JSON.parse(currTabElement.getAttribute("data-tab-is-divided") as string) as boolean;

        if (isCurrTabCombine || isCurrTabDivided) {
          currTabElement.setAttribute("data-tab-is-combine", "false");
          currTabElement.setAttribute("data-tab-is-divided", "false");

          if (isCurrTabCombine) {
            const combineGroupId = currTabElement.getAttribute("data-tab-combine-group-id") as string;
            const combineGroupElement = document.getElementById(combineGroupId);
            if (combineGroupElement) {
              handleTabLeaveGroup(combineGroupElement, currTabElement);
            }
            currTabElement.setAttribute("data-tab-combine-group-id", "");
            currTabElement.setAttribute("data-tab-prev-combine-group-id", "");
          }

          handleTabJoinGroup(currGroupElement, currTabElement);

          const currTabIdx = currTabElement.getAttribute("data-tab-idx") as string;
          boardLayoutDispatch({
            type: "UPDATE_TAB_INDICATOR",
            payload: {
              groupId: currGroupId,
              tabIdx: Number(currTabIdx),
            },
          });
        } else {
          const currTabIdx = JSON.parse(currTabElement.getAttribute("data-tab-idx") as string) as number;

          let currTabNewIdx = Math.floor((currTabElement.offsetLeft + currTabElement.offsetWidth / 2) / currTabElement.offsetWidth);
          const currGroupTabCnts = boardDataContextRef.current.group[currGroupId].tabIds.length;
          if (currTabNewIdx >= currGroupTabCnts) currTabNewIdx = currGroupTabCnts - 1;
          if (currTabNewIdx <= 0) currTabNewIdx = 0;
          if (currTabNewIdx === currTabIdx) return;

          if (currTabIdx > currTabNewIdx) {
            // move left way
            for (let i = currTabIdx - 1; i >= currTabNewIdx; i--) {
              const tabElement = currGroupElement.querySelector(`[data-tab-idx="${i}"]`);
              if (tabElement instanceof HTMLElement) {
                tabElement.setAttribute("data-tab-idx", JSON.stringify(i + 1));
                const dataTabTranslateStatus = tabElement.getAttribute("data-tab-translate-status") as string;
                if (dataTabTranslateStatus === TAB_TRANSLATE_STATUS.Default) {
                  tabElement.style.transform = `translate(${currTabElement.offsetWidth}px, 0px)`;
                  tabElement.setAttribute("data-tab-translate-status", TAB_TRANSLATE_STATUS.Right);
                } else if (dataTabTranslateStatus === TAB_TRANSLATE_STATUS.Left) {
                  tabElement.style.transform = "translate(0px, 0px)";
                  tabElement.setAttribute("data-tab-translate-status", TAB_TRANSLATE_STATUS.Default);
                }
              }
            }
          } else {
            // move right way
            for (let i = currTabIdx + 1; i <= currTabNewIdx; i++) {
              const tabElement = currGroupElement.querySelector(`[data-tab-idx="${i}"]`);
              if (tabElement instanceof HTMLElement) {
                tabElement.setAttribute("data-tab-idx", JSON.stringify(i - 1));
                const dataTabTranslateStatus = tabElement.getAttribute("data-tab-translate-status") as string;
                if (dataTabTranslateStatus === TAB_TRANSLATE_STATUS.Default) {
                  tabElement.style.transform = `translate(${-currTabElement.offsetWidth}px, 0px)`;
                  tabElement.setAttribute("data-tab-translate-status", TAB_TRANSLATE_STATUS.Left);
                } else if (dataTabTranslateStatus === TAB_TRANSLATE_STATUS.Left) {
                } else {
                  tabElement.style.transform = "translate(0px, 0px)";
                  tabElement.setAttribute("data-tab-translate-status", TAB_TRANSLATE_STATUS.Default);
                }
              }
            }
          }

          currTabElement.setAttribute("data-tab-idx", JSON.stringify(currTabNewIdx));
          boardLayoutDispatch({
            type: "UPDATE_TAB_INDICATOR",
            payload: {
              groupId: currGroupId,
              tabIdx: Number(currTabNewIdx),
            },
          });
        }
      }

      return;
    }

    /**
     * Group Move
     */
    const groupHeaderElement = document.querySelector("[data-group-header-is-dragging=true]");
    const groupElement = groupHeaderElement?.parentElement;
    if (groupElement) {
      const dataPos = groupElement.getAttribute("data-position");
      const dataMouseDownPos = groupHeaderElement.getAttribute("data-mouse-down-position");
      if (dataPos && dataMouseDownPos) {
        const pos = JSON.parse(dataPos) as IPosition;
        const mouseDownPos = JSON.parse(dataMouseDownPos) as IPosition;

        let dx = e.clientX - containerLeft - pos.x;
        let dy = e.clientY - containerTop - pos.y;

        let dTop = groupElement.offsetTop + dy;
        let dLeft = groupElement.offsetLeft + dx;

        const { minTop, maxTop, minLeft, maxLeft } = getGroupElementBoundaryPositions(containerRef as any, groupElement);
        if (dTop <= minTop) dTop = minTop;
        if (dTop >= maxTop) dTop = maxTop;
        if (dLeft <= minLeft) dLeft = minLeft;
        if (dLeft >= maxLeft) dLeft = maxLeft;

        groupElement.style.top = `${dTop}px`;
        groupElement.style.left = `${dLeft}px`;

        /**
         * Group Indicate
         */
        if (e.clientY <= containerTop) {
          setGroupIndicate({
            position: {
              x: minLeft,
              y: 0,
            },
            size: { width: containerWidth, height: containerHeight / 2 },
          });
        } else if (e.clientY >= containerTop + containerHeight) {
          setGroupIndicate({
            position: {
              x: minLeft,
              y: containerHeight / 2,
            },
            size: { width: containerWidth, height: containerHeight / 2 },
          });
        } else if (e.clientX <= containerLeft) {
          setGroupIndicate({
            position: {
              x: minLeft,
              y: 0,
            },
            size: { width: containerWidth / 2, height: containerHeight },
          });
        } else if (e.clientX >= containerLeft + containerWidth) {
          setGroupIndicate({
            position: {
              x: containerWidth / 2,
              y: 0,
            },
            size: { width: containerWidth / 2, height: containerHeight },
          });
        } else {
          setGroupIndicate(null);
        }

        /**
         * Recover Mouse Pointer
         */
        pos.x = dLeft + mouseDownPos.x;
        pos.y = dTop + mouseDownPos.y;

        groupElement.setAttribute("data-position", JSON.stringify(pos));
      }
    }
  };

  const handleMouseUpContainer = (e: MouseEvent) => {
    if (!boardDataDispatch) return;

    /**
     * Resize
     */
    const resizeHandlerElement = document.querySelector("[data-resize-handler-is-dragging=true]");
    if (resizeHandlerElement) {
      resizeHandlerElement.setAttribute("data-resize-handler-is-dragging", "false");

      const dataGroupId = resizeHandlerElement.getAttribute("data-group-id");
      if (!dataGroupId) return;
      const groupElement = document.getElementById(dataGroupId);

      if (groupElement) {
        const { offsetTop, offsetLeft, offsetWidth, offsetHeight } = groupElement;
        boardDataDispatch({
          type: "UPDATE_GROUP_SIZE",
          payload: {
            groupId: dataGroupId,
            x: Number(offsetLeft),
            y: Number(offsetTop),
            width: offsetWidth,
            height: offsetHeight,
          },
        });
      }
      return;
    }

    /**
     * Tab Move
     */
    const currTabElement = document.querySelector("[data-tab-is-dragging=true]");
    if (boardLayoutDispatch) {
      boardLayoutDispatch({
        type: "UPDATE_TAB_INDICATOR",
        payload: {
          groupId: "",
          tabIdx: 0,
        },
      });
    }

    if (currTabElement instanceof HTMLElement) {
      const currGroupHeaderElement = currTabElement.parentElement as HTMLElement;
      const currGroupId = currGroupHeaderElement.id;

      currTabElement.setAttribute("data-tab-is-dragging", "false");

      const dataTabMoveStatus = currTabElement.getAttribute("data-tab-move-status") as string;
      if (dataTabMoveStatus === TAB_MOVE_STATUS.Default) {
        const groupTabsNewIdList = getGroupTabsNewIdList(currGroupHeaderElement, currTabElement);

        boardDataDispatch({
          type: "UPDATE_GROUP_TABS_ID_LIST",
          payload: {
            groupId: currGroupId,
            tabIds: groupTabsNewIdList,
          },
        });

        resetGroupTabsTranslate(currGroupHeaderElement, currTabElement);
      } else if (dataTabMoveStatus === TAB_MOVE_STATUS.Combine) {
        const combineGroupId = currTabElement.getAttribute("data-tab-combine-group-id") as string;
        let combineGroupHeaderElement: HTMLElement | null = null;
        document.querySelectorAll("[data-group-header]").forEach((groupHeaderElement) => {
          if (groupHeaderElement.id === combineGroupId) {
            combineGroupHeaderElement = groupHeaderElement as HTMLElement;
            return;
          }
        });

        if (combineGroupHeaderElement) {
          const groupTabsNewIdList = getGroupTabsNewIdList(combineGroupHeaderElement, currTabElement);
          boardDataDispatch({
            type: "COMBINE_GROUP",
            payload: {
              currGroupId,
              combGroupId: combineGroupId,
              currTabId: currTabElement.id,
              combTabIds: groupTabsNewIdList,
            },
          });

          resetGroupTabsTranslate(combineGroupHeaderElement, currTabElement);
          resetGroupTabsTranslate(currGroupHeaderElement, currTabElement);
        }

        currTabElement.setAttribute("data-tab-combine-group-id", "");
        currTabElement.setAttribute("data-tab-prev-combine-group-id", "");
      } else {
        if (groupIndicateRef.current) {
          resetGroupTabsTranslate(currGroupHeaderElement, currTabElement);

          boardDataDispatch({
            type: "DIVIDE_GROUP",
            payload: {
              groupId: currGroupId,
              tabId: currTabElement.id,
              position: groupIndicateRef.current.position,
              size: groupIndicateRef.current.size,
            },
          });
        }

        setGroupIndicate(null);

        const groupElements = document.querySelectorAll("[data-group]");
        groupElements.forEach((groupElement) => {
          (groupElement as HTMLElement).style.zIndex = CUSTOM_ZINDEX.Default;
        });
      }

      currTabElement.setAttribute("data-tab-move-status", TAB_MOVE_STATUS.Default);
      currTabElement.style.zIndex = CUSTOM_ZINDEX.Default;
      return;
    }

    /**
     * Group Move
     */
    const groupHeaderElement = document.querySelector("[data-group-header-is-dragging=true]");
    const groupElement = groupHeaderElement?.parentElement;
    const dataGroupId = groupHeaderElement?.getAttribute("data-group-id");
    if (groupElement && dataGroupId) {
      groupHeaderElement.setAttribute("data-group-header-is-dragging", "false");

      if (groupIndicateRef.current) {
        const { position, size } = groupIndicateRef.current;
        groupElement.style.left = `${position.x}px`;
        groupElement.style.top = `${position.y}px`;
        boardDataDispatch({
          type: "UPDATE_GROUP_SIZE",
          payload: {
            groupId: dataGroupId,
            x: position.x,
            y: position.y,
            width: size.width,
            height: size.height,
          },
        });
        setGroupIndicate(null);
      } else {
        boardDataDispatch({
          type: "UPDATE_GROUP_POSITION",
          payload: {
            groupId: dataGroupId,
            x: Number(groupElement.offsetLeft),
            y: Number(groupElement.offsetTop),
          },
        });
      }
      return;
    }
  };

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMoveContainer);
    document.addEventListener("mouseup", handleMouseUpContainer);

    return () => {
      document.removeEventListener("mousedown", handleMouseMoveContainer);
      document.removeEventListener("mouseup", handleMouseUpContainer);
    };
  }, []);

  return (
    <div id="container" ref={containerRef} className="w-[inherit] h-[inherit] relative" data-container>
      {children}
      {groupIndicate && (
        <div
          className="absolute border-2 border-green-500 bg-green-500/40 shadow-sm shadow-green-300 z-20"
          style={{
            top: groupIndicate.position.y,
            left: groupIndicate.position.x,
            width: groupIndicate.size.width,
            height: groupIndicate.size.height,
          }}
        />
      )}
    </div>
  );
};

const Groups = () => {
  const boardContext = useContext(BoardDataStateContext);

  return (
    <React.Fragment>
      {Object.keys(boardContext.group).map((groupId) => (
        <Group key={groupId} {...boardContext.group[groupId]} />
      ))}
    </React.Fragment>
  );
};

const Group = React.forwardRef<React.ElementRef<"div">, IGroup[keyof IGroup]>((props, forwardedRef) => {
  const boardContext = useContext(BoardDataStateContext);
  const { id, size, position: initialPosition, selectedTabId } = props;

  const groupElementPosition = useMemo(
    () => ({
      x: 0,
      y: 0,
    }),
    []
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    setGroupElementInFront(e.currentTarget.id);
  };

  return (
    <div
      className="absolute bg-white shadow-xl"
      ref={forwardedRef}
      style={{ width: size.width, height: size.height, left: initialPosition.x, top: initialPosition.y }}
      onMouseDown={handleMouseDown}
      id={id}
      data-group
      data-position={JSON.stringify(groupElementPosition)}
    >
      <GroupHeader {...props} groupElementPosition={groupElementPosition} />
      <ResizeHandlers groupId={id} />
      <div>{boardContext.tab[selectedTabId].name}</div>
    </div>
  );
});

const GroupHeader = React.forwardRef<React.ElementRef<"div">, IGroupHeaderProps>((props, forwardedRef) => {
  const { id: groupId, tabIds, groupElementPosition } = props;
  const boardDataDispatch = useContext(BoardDataDispatchContext);
  const boardLayoutContext = useContext(BoardLayoutStateContext);
  const groupHeaderRef = useRef<React.ElementRef<"div">>(null);

  const groupHeaderMouseDownPosition = useMemo(() => ({ x: 0, y: 0 }), []);

  const handleMouseDown = (e: React.MouseEvent) => {
    const groupHeaderElement = e.currentTarget;
    groupHeaderElement.setAttribute("data-group-header-is-dragging", "true");

    const containerElement = document.getElementById("container") as HTMLDivElement;

    groupElementPosition.x = e.clientX - containerElement.getBoundingClientRect().x;
    groupElementPosition.y = e.clientY - containerElement.getBoundingClientRect().y;
    groupHeaderElement.parentElement?.setAttribute("data-position", JSON.stringify(groupElementPosition));

    groupHeaderMouseDownPosition.x = e.clientX - groupHeaderElement.getBoundingClientRect().x;
    groupHeaderMouseDownPosition.y = e.clientY - groupHeaderElement.getBoundingClientRect().y;
    groupHeaderElement.setAttribute("data-mouse-down-position", JSON.stringify(groupHeaderMouseDownPosition));
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    const groupHeaderElement = e.currentTarget;
    const groupElement = groupHeaderElement.parentElement;
    const containerElement = document.querySelector("[data-container]") as HTMLElement | null;
    if (boardDataDispatch && containerElement && groupElement) {
      const isFullScreen = groupElement.offsetWidth === containerElement.offsetWidth && groupElement.offsetHeight === containerElement.offsetHeight;
      boardDataDispatch({
        type: "UPDATE_GROUP_FULL_SCREEN",
        payload: {
          groupId,
          x: 0,
          y: 0,
          width: containerElement.offsetWidth,
          height: containerElement.offsetHeight,
          isFullScreen,
        },
      });
    }
  };

  return (
    <div
      className="relative w-full h-[30px] cursor-pointer bg-[rgb(43,43,43)] border-b-[1px] border-solid border-[gray]"
      ref={groupHeaderRef}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      id={groupId}
      data-group-header
      data-group-id={groupId}
      data-group-header-is-dragging={false}
      data-mouse-down-position={JSON.stringify(groupHeaderMouseDownPosition)}
    >
      {tabIds.map((tabId, idx) => (
        <Tab key={tabId} {...props} tabId={tabId} tabIdx={idx} />
      ))}
      {boardLayoutContext.tabIndicate.groupId === groupId && (
        <div
          className="absolute h-[100%] border-2 border-green-500 bg-green-500/40 shadow-sm shadow-green-300 z-20"
          style={{ left: boardLayoutContext.tabIndicate.tabIdx * TAB_SIZE.Width, width: TAB_SIZE.Width }}
        />
      )}
    </div>
  );
});

const Tab = React.forwardRef<React.ElementRef<"div">, ITabProps>((props, forwardedRef) => {
  const { id: groupId, tabId, tabIdx } = props;
  const boardDataContext = useContext(BoardDataStateContext);
  const boardDataDispatch = useContext(BoardDataDispatchContext);

  const selectedTabId = boardDataContext.group[groupId].selectedTabId;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (boardDataDispatch) {
      boardDataDispatch({
        type: "SELECT_TAB",
        payload: {
          groupId,
          tabId,
        },
      });
    }

    const tabElement = e.currentTarget as HTMLElement;
    tabElement.style.zIndex = CUSTOM_ZINDEX.Top;

    setGroupElementInFront(groupId);

    tabElement.setAttribute("data-tab-is-dragging", "true");
    tabElement.setAttribute("data-position", JSON.stringify({ x: e.clientX, y: e.clientY }));
  };

  return (
    <div
      className={`absolute flex justify-center items-center cursor-pointer transition-transform duration-300 font-extralight text-slate-400 hover:bg-slate-400/20 shadow-[0px_0px_0px_0.5px_inset] ${
        tabId === selectedTabId && "bg-slate-400/20"
      }`}
      style={{ left: tabIdx * TAB_SIZE.Width, width: TAB_SIZE.Width, height: TAB_SIZE.Height }}
      onMouseDown={handleMouseDown}
      id={tabId}
      data-group-id={groupId}
      data-tab-id={tabId}
      data-tab-idx={tabIdx}
      data-tab-is-dragging={false}
      data-tab-is-divided={false}
      data-tab-is-combine={false}
      data-tab-move-status={TAB_MOVE_STATUS.Default}
      data-tab-translate-status={TAB_TRANSLATE_STATUS.Default}
      data-tab-combine-group-id=""
      data-tab-prev-combine-group-id=""
      data-position={JSON.stringify({ x: 0, y: 0 })}
    >
      <div className={`${tabId === selectedTabId && "text-white"}`}>{boardDataContext.tab[tabId].name}</div>
    </div>
  );
});

const resizeHandlerVariants = cva("absolute", {
  variants: {
    direction: {
      [RESIZE_DIRECTIONS.Top]: "top-0 left-[10px] w-[calc(100%-20px)] h-[10px] cursor-ns-resize",
      [RESIZE_DIRECTIONS.Bottom]: "bottom-0 left-[10px] w-[calc(100%-20px)] h-[10px] cursor-ns-resize",
      [RESIZE_DIRECTIONS.Left]: "left-0 top-[10px] w-[10px] h-[calc(100%-20px)] cursor-ew-resize",
      [RESIZE_DIRECTIONS.Right]: "right-0 top-[10px] w-[10px] h-[calc(100%-20px)] cursor-ew-resize",
      [RESIZE_DIRECTIONS.TopLeft]: "top-0 left-0 w-[10px] h-[10px] cursor-nwse-resize",
      [RESIZE_DIRECTIONS.TopRight]: "top-0 right-0 w-[10px] h-[10px] cursor-nesw-resize",
      [RESIZE_DIRECTIONS.BottomLeft]: "bottom-0 left-0 w-[10px] h-[10px] cursor-nesw-resize",
      [RESIZE_DIRECTIONS.BottomRight]: "bottom-0 right-0 w-[10px] h-[10px] cursor-nwse-resize",
    },
  },
});

const ResizeHandlers = ({ groupId }: { groupId: string }) => {
  const resizeHandlerElementPosition = useMemo(() => ({ x: 0, y: 0 }), []);

  const handleMouseDown = (e: React.MouseEvent) => {
    const resizeHandlerElement = e.target as HTMLElement;

    resizeHandlerElement.setAttribute("data-resize-handler-is-dragging", "true");

    resizeHandlerElementPosition.x = e.clientX;
    resizeHandlerElementPosition.y = e.clientY;
    resizeHandlerElement.setAttribute("data-position", JSON.stringify(resizeHandlerElementPosition));
  };

  return (
    <React.Fragment>
      {(Object.keys(RESIZE_DIRECTIONS) as Array<keyof typeof RESIZE_DIRECTIONS>).map((direction) => (
        <div
          key={direction}
          className={cn(resizeHandlerVariants({ direction }))}
          onMouseDown={handleMouseDown}
          data-group-id={groupId}
          data-direction={direction}
          data-resize-handler-is-dragging={false}
          data-position={JSON.stringify(resizeHandlerElementPosition)}
        />
      ))}
    </React.Fragment>
  );
};

Group.displayName = "Group";
GroupHeader.displayName = "GroupHeader";
Tab.displayName = "Tab";

export { Provider, Container, Groups };
