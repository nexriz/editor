import React, { useEffect, useRef, useState, useCallback, useContext, useMemo, createContext, useReducer, forwardRef} from 'react'
import Konva from 'konva'
import useTransformer from '../hooks/useTransformer'
import getDragDirection from '../utils/getDragDirection'
import PDF2SVG from '../utils/pdf2svg'
import KonvaContext from '../context/konvacontext'
import Structure from './Structure'
import canvg from 'canvg'
import { NavContainer, NavButton, Icon, StageContainer, CanvasWrapper, LeftSide, RightSide, SideMenu, SideMenuHeader, SideMenuParameters, Options, Input, AttributeSection, FormWrapper} from './styles'
import CursorIcon from './styles/cursor_normal'
import InputColor from 'react-input-color'
import { width, height, offset } from '../utils/config'
import CodeMirrorInput from './compact/Input' 
import { SVG } from '@svgdotjs/svg.js'
import {HCenter,HLeft,HRight,VBottom,VCenter,VTop } from './styles/alignIcons'
import { SketchPicker, BlockPicker} from 'react-color';
// PDF2SVG.from().then(console.log)

function DisplayText(object, stage) {
  if(object) {
    switch(object.className) {
      case "Rect": return "Rektangel"
      case "Text": return "Text"
      case "Image": return "Bild"
      case "Line": return "Signatur"
      default: return null
    }
  }
  return null
}


function getSelectedObject(selected, stage) {
  if(selected) {
    const object = stage.findOne("#"+selected)
    return object
  }

  return null
}


function ColorPickerForm(props) {
  const { width, ...restProps} = props

  return (
    <FormWrapper>
      <label style={{color: "#989898", margin: "0 5px"}} htmlFor="">{props.label}</label>
      <div style={{ width, height: 20, background: props.color, borderRadius: 5, margin: "5px 5px 10px",  }}/>
      <SketchPicker {...restProps} disableAlpha={true}  />
    </FormWrapper>
  )
}

function InputForm(props) {
  return (
    <FormWrapper>
      <label style={{color: "#989898", margin: "0 5px"}} htmlFor="">{props.label}</label>
      <Input {...props}/>
    </FormWrapper>
  )
}


function OptionsForm(props) {
  const { onChange, value, ...restProps } = props
  return (
    <FormWrapper>
      <label style={{color: "#989898", margin: "0 5px"}} htmlFor="">{props.label}</label>
      <Options {...restProps}>
        <select onChange={onChange} value={value}>
          {props.data.map(field => <option selected={field.value === props.selected} value={field.value}>{field.label}</option>)}
        </select>
      </Options>
    </FormWrapper>
  )
}


function TextFormAttributes(props) {
  const { stage, selectedObject } = props

  const [attrs, setAttrs] = useState(() => selectedObject && {...selectedObject.attrs, fontFamily: selectedObject.fontFamily(), fontStyle: selectedObject.fontStyle()})

  const updateAttrs = useCallback(() => {

    setAttrs({...selectedObject.attrs, fontFamily: selectedObject.fontFamily(), fill: selectedObject.fill() })
  }, [selectedObject, selectedObject.id(), stage])


  const onChangeAlign = (e) => {

    selectedObject.align(e.target.value)
    if(selectedObject.parent) {
      selectedObject.parent.draw()
    }
    updateAttrs()
  }

  const onChangeFontFamily = (e) => {

    selectedObject.fontFamily(e.target.value)
    if(selectedObject.parent) {
      selectedObject.parent.draw()
    }
    updateAttrs()
  }

  const onChangeSpecialText = (e) => {
    selectedObject.setAttr("specialText", e.target.value)
    if(selectedObject.parent) {
      selectedObject.parent.draw()
    }
    updateAttrs()
  }


  const onChangeFontSize = (e) => {
    selectedObject.fontSize(+e.target.value)
    if(selectedObject.parent) {
      selectedObject.parent.draw()
      
    }
    updateAttrs()
  }


  const onChangeFontWeight = (e) => {
    selectedObject.fontStyle(e.target.value)
    if(selectedObject.parent) {
      selectedObject.parent.draw()
    }
    updateAttrs()
  }

  const onChangeFontColor = (e) => {
    selectedObject.fill(e.target.value)
    if(selectedObject.parent) {
      selectedObject.parent.draw()
    }
    updateAttrs()
  }

  const optionsDataFontFamilies = [{ value: "Arial", label: "Arial"}, { value: "Helvetica", label: "Helvetica"}, { value: "sans-serif", label: "Sans-serif"}, { value: "Times", label: "Times"}]
  const optionsDataFontStyles = [{ value: "normal", label: "Normal"}, { value: "bold", label: "Bold"}, { value: "italic", label: "Italic"}]
  const optionsDataAlign = [{ value: "left", label: "Vänster"}, { value: "center", label: "Mitten"}, { value: "right", label: "Höger"}]


  return (
    <AttributeSection>
          <InputForm onChange={onChangeSpecialText} value={attrs.specialText} width={"150px"} label={"Mall"} type="text"/>
          <OptionsForm onChange={onChangeFontFamily} label="Typsnitt" value={attrs.fontFamily}  selected={"Times"} width={"150px"} data={optionsDataFontFamilies} />
          <InputForm onChange={onChangeFontSize} value={Math.round(attrs.fontSize)} width={"150px"} label={"Text storlek"} type="number"/>
          <OptionsForm onChange={onChangeFontWeight} label={"Text-tjocklek"} value={attrs.fontStyle} selected={"normal"} width={"150px"} data={optionsDataFontStyles} />
          <OptionsForm onChange={onChangeAlign} label="Text-justering" value={attrs.align}  selected={"left"} width={"150px"} data={optionsDataAlign} />
          <InputForm onChange={onChangeFontColor} value={attrs.fill} width={"150px"} height={"40px"} label={"Text färg"} type="color"/>
          
    </AttributeSection>
  )
}



function getRectAttrs(selectedObject) {
  return {...selectedObject.attrs, width: selectedObject.width(), height: selectedObject.height(), fill: selectedObject.fill(), stroke: selectedObject.stroke(), strokeWidth: selectedObject.strokeWidth(), cornerRadius: selectedObject.cornerRadius() }
}




function RectFormAttributes(props) {
  const { stage, selectedObject } = props
  const [attrs, setAttrs] = useState(() => selectedObject && getRectAttrs(selectedObject))


  useEffect(() => {

    setAttrs(getRectAttrs(selectedObject))
  },[selectedObject.id()])
  
  const updateAttrs = useCallback(() => {
    setAttrs(getRectAttrs(selectedObject))
  }, [selectedObject])
  
  const onChangeRectColor = (color) => {
    selectedObject.fill(color.target.value)
    selectedObject.parent.draw()
    updateAttrs()
  }

  const onChangeRectBorderColor = (e) => {
    selectedObject.stroke(e.target.value)
    selectedObject.parent.draw()
    updateAttrs()
  }

  const onChangeRectBorderWidth = (e) => {
    if(e.target.value < 0) return
    const transformer = stage.findOne("#"+selectedObject.id()+"_transformer")
    selectedObject.strokeWidth(+e.target.value)
    transformer.padding(selectedObject.strokeWidth() / 2)
    transformer.update()
    selectedObject.parent.draw()
    updateAttrs()
  }

  const onChangeRectBorderCornerRadius = (e) => {
    if(e.target.value < 0) return
    const transformer = stage.findOne("#"+selectedObject.id()+"_transformer")
    selectedObject.cornerRadius(+e.target.value)
    transformer.update()
    selectedObject.parent.draw()
    updateAttrs()
  }

  return (
    <AttributeSection>
        <AttributeSection style={{display: "flex", justifyContent: "center", marginTop: 50, flexFlow: "row"}}>
          {/* <ColorPickerForm onChangeComplete={onChangeRectColor} width={"75px"} height={"40px"} label={"Fyll"} color={attrs.fill} /> */}
          <InputForm onChange={onChangeRectColor} onClick={() => {}} value={attrs.fill} width={"75px"} height={"40px"} label={"Fyll"} type="color" colorFormat="rgba" />
          <InputForm onChange={onChangeRectBorderColor} value={attrs.stroke} width={"75px"} height={"40px"} label={"Kant"} type="color" colorFormat="rgba"/>
        </AttributeSection>
        <AttributeSection style={{display: "flex", justifyContent: "center", marginTop: 0, flexFlow: "row"}}>
          <InputForm onChange={onChangeRectBorderWidth} value={attrs.strokeWidth} width={"75px"} height={"40px"} label={"Kant"} type="number"/>
          <InputForm onChange={onChangeRectBorderCornerRadius} value={attrs.cornerRadius} width={"75px"} height={"40px"} label={"Radius"} type="number"/>
        </AttributeSection>
    </AttributeSection>
  )
}

function getShapeSizeAttrs(selectedObject) {
  return {...selectedObject.attrs, width: selectedObject.width(), height: selectedObject.height()}
}


function getShapeSizeAttrsScale(selectedObject) {
  return {...selectedObject.attrs, width: selectedObject.width() * selectedObject.scaleX(), height: selectedObject.height() * selectedObject.scaleY()}
}

function ShapeSizeAttributes(props) {
  const { stage, selectedObject } = props
  const [attrs, setAttrs] = useState(() => selectedObject && getShapeSizeAttrs(selectedObject))
  const ts = useRef()





  useEffect(() => {
    const transformer = stage.findOne("#"+selectedObject.id()+"_transformer")
    setAttrs(getShapeSizeAttrsScale(selectedObject, transformer))

    if(ts.current) {
      clearTimeout(ts.current)
      ts.current = null
    }
  
    

    const id = selectedObject.id()
    const shape = selectedObject
    const updateFunc = () => {
      if(shape.className !== "Text") {
        setAttrs(getShapeSizeAttrsScale(selectedObject))
        shape.setAttrs({
          width: Math.max(shape.width() * shape.scaleX(), 5),
          height: Math.max(shape.height() * shape.scaleY(), 5),
          scaleX: 1,
          scaleY: 1,
        })
        
      }
    }

    shape.on("transform."+id, updateFunc)
    // shape.on("transform."+id,updateFunc)
    shape.dragBoundFunc(updateFunc)

    

    const handleKeyPress = e => {
      if(selectedObject) {
        const node = selectedObject
        let jump = e.shiftKey ? 10 : 1
        if(e.altKey) {
          switch(e.keyCode) {
            case 37: 
              node.width(node.width() - jump) 
              break
            case 38:
              node.height(node.height() - jump) 
              break
            case 39: 
              node.width(node.width() + jump) 
              break
            case 40:
              node.height(node.height() + jump) 
              break
          }

        } else {
          switch(e.keyCode) {
            case 37: 
              node.x(node.x() - jump) 
              break
            case 38:
              node.y(node.y() - jump) 
              break
            case 39: 
              node.x(node.x() + jump) 
              break
            case 40:
              node.y(node.y() + jump) 
              break
          }
        }


        if(ts.current) {
          clearTimeout(ts.current)
          ts.current = null
        }

        ts.current = setTimeout(() => {
          selectedObject && transformer.resizeEnabled(true)
          selectedObject && transformer.setAttr("borderStroke", "#0099ff")
          selectedObject && transformer.setZIndex(node.parent.children.length)
          node.parent.draw()
        }, 500)

        transformer.resizeEnabled(false)
        transformer.setAttr("borderStroke", "transparent")

        node.parent.draw()
        updateFunc()
      }
    }

    window.document.addEventListener("keydown", handleKeyPress)

    return () => {
      shape.off("transform."+id)
      shape.dragBoundFunc(null)
      window.document.removeEventListener("keydown", handleKeyPress)
    }
  },[selectedObject.id()])
  
  const updateAttrs = useCallback(() => {
    setAttrs(getShapeSizeAttrs(selectedObject))
  }, [selectedObject.id()])
  
  const onChangeWidth = useCallback((e) => {
    if(e.target.value < -1) return
    selectedObject.width(+e.target.value)
    selectedObject.scaleY(1)
    selectedObject.scaleX(1)
    selectedObject.parent.draw()
    updateAttrs()
  },[selectedObject.id()])

  const onChangeHeight = useCallback((e) => {
    if(+e.target.value < -1) return
    selectedObject.height(+e.target.value)
    selectedObject.scaleY(1)
    selectedObject.scaleX(1)
    selectedObject.parent.draw()
    updateAttrs()
  },[selectedObject.id()])

  const onChangeX = useCallback((e) => {
    if(+e.target.value < -1) return
    selectedObject.x(+e.target.value + 100)
    selectedObject.parent.draw()
    updateAttrs()
  },[selectedObject.id()])

  const onChangeY = useCallback((e) => {
    if(e.target.value < -1) return
    selectedObject.y(+e.target.value + 100)
    selectedObject.parent.draw()
    updateAttrs()
  },[selectedObject.id()])


  const alignObject = useCallback(type => e => {
    const layer = selectedObject.parent
    const stage = layer.parent

    
    if(stage) {
      const background = stage.findOne("#background")

      switch(type) {
        case "hleft": 
          selectedObject.x(background.x())
          break;

        case "hcenter": 
          selectedObject.x(background.x() + (background.width() / 2) - (selectedObject.width() / 2))
          break
          
        case "hright": 
          selectedObject.x(background.x() + (background.width() - selectedObject.width()))
          break
          
        case "vtop": 
          selectedObject.y(background.y())
          break
          
        case "vcenter": 
          selectedObject.y(background.y() + (background.height() / 2) - (selectedObject.height() / 2) )
          break

        case "vbottom": 
          selectedObject.y(background.y() + (background.height() - selectedObject.height()))
          break
          
      }
    }

    selectedObject.parent.draw()
    updateAttrs()
  },[selectedObject.id()])

  return (
    <AttributeSection>
        <AttributeSection style={{display: "flex", justifyContent: "center", marginTop: 0, flexFlow: "row"}}>
          <InputForm onChange={onChangeWidth} value={Math.round(attrs.width)} width={"75px"} height={"40px"} style={{fontSize: "14px"}} label={"Bredd"} type="number"/>
          {!props.hideHeight && <InputForm onChange={onChangeHeight} value={Math.round(attrs.height)} width={"75px"} height={"40px"} style={{fontSize: "14px"}} label={"Höjd"} type="number"/>}
        </AttributeSection>
        <AttributeSection style={{display: "flex", justifyContent: "center", marginTop: 0, flexFlow: "row"}}>
          <InputForm onChange={onChangeX} value={Math.round(attrs.x) - 100} width={"75px"} height={"40px"} style={{fontSize: "14px"}} label={"X"} type="number"/>
          <InputForm onChange={onChangeY} value={Math.round(attrs.y) - 100} width={"75px"} height={"40px"} style={{fontSize: "14px"}} label={"Y"} type="number"/>
        </AttributeSection>

        <AttributeSection style={{display: "flex", justifyContent: "center", marginTop: 20, flexFlow: "row"}}>
            <NavButton onClick={alignObject("hleft")} style={{padding: 9}}><HLeft size="20px"/></NavButton>
            <NavButton onClick={alignObject("hcenter")} style={{padding: 9}}><HCenter size="20px"/></NavButton>
            <NavButton onClick={alignObject("hright")} style={{padding: 9}}><HRight size="20px"/></NavButton>
        </AttributeSection>
        <AttributeSection style={{display: "flex", justifyContent: "center", marginTop: 10, marginBottom: 10, flexFlow: "row"}}>
            <NavButton onClick={alignObject("vtop")} style={{padding: 9}}><VTop  size="20px"/></NavButton>
            <NavButton onClick={alignObject("vcenter")} style={{padding: 9}}><VCenter size="20px"/></NavButton>
            <NavButton onClick={alignObject("vbottom")} style={{padding: 9}}><VBottom size="20px"/></NavButton>
        </AttributeSection>
    </AttributeSection>
  )
}


async function getDataUrl(img) {

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  canvas.width = img.width
  canvas.height = img.height


  ctx.drawImage(img, 0, 0)

  let blob = await fetch(img.src).then(r => r.blob())


  return canvas.toDataURL(blob.type)
}





function Stage(props) {
    const [stage, setStage] = useState(null)
    
    const context = useContext(KonvaContext)
    const { store, setSelected, setMode } = context
    const { selected } = store
    const selectedObject = useMemo(() => getSelectedObject(store.selected, stage), [stage, store.selected])
    const currRef = useRef()
    const textboxRef = useRef()
    const [svgText, setSvgText] = useState("")

    

    

    useEffect(() => {
      if(stage) {
        stage.on("click.selecting", (e) => {
          const id = e.target.id()
          if(store.mode === "HAND" && id !== "background") {
            setSelected(e.target.id())
          }
          if(id === "background") {
            setSelected(null)
          }
        })
      }

      return () => {
        if(stage) {
          stage.off("click.selecting")
        }
      }

    },[stage, store.mode])

    
    const canvasCB = useCallback((ref) => {
      const { attrs={} } = props
      
      
     


      const stage = new Konva.Stage({
        ...attrs,
        container: ref,
        pixelRatio: 4,
        width: width,
        height: height
       
      })

      currRef.current = ref



      const backgroundLayer = new Konva.Layer({
        width,
        height, 
        x: 0, 
        y: 0
      })

      const backgroundRect = new Konva.Rect({
        width: width - offset, 
        height: height - offset, 
        x: offset / 2, 
        y: offset / 2, 
        fill: "#fff", 
        name: "background", 
        id: "background", 
        stroke: "#ccc", 
        strokeWidth: 1
      })

      const backgroundText = new Konva.Text({
        width:78,
        x:offset / 2,
        y: (offset / 2) - 10 - 1,
        fontSize:10,
        fill:"#a8a8a8",
        enabledAnchors:["middle-left","middle-right"],
        text:"Scen"
      })
      


      const backgroundWidthText = new Konva.Text({
        width:50,
        x: (width / 2) - 50 / 2,
        y: (offset / 2) - 13,
        fontSize:10,
        fill:"#a8a8a8",
        text: width - offset,
        align:"center"
      })

      const backgroundHeightText = new Konva.Text({
        width:50,
        x:width - (50 / 2) - (offset / 2) + 11,
        y: (height / 2) -(10 / 2),
        fontSize:10,
        fill:"#a8a8a8",
        enabledAnchors:["middle-left","middle-right"],
        text: height - offset,
        align:"center"
      })

      backgroundLayer.add(backgroundRect)
      backgroundLayer.add(backgroundText)
      backgroundLayer.add(backgroundWidthText)
      backgroundLayer.add(backgroundHeightText)

      stage.add(backgroundLayer)


      window.document.addEventListener("click", e => {
        console.log(document.querySelector("#rightside").contains(e.target))
        if(!ref.contains(e.target) && !document.querySelector("#rightside").contains(e.target)) {
          setSelected(null)
        }
      })
  
  
       // add a new feature, lets add ability to draw selection rectangle
     
  
      setStage(stage)


      // var scaleBy = 1.01;
      // stage.on('wheel', (e) => {
      //   e.evt.preventDefault();
      //   var oldScale = stage.scaleX();

      //   var pointer = stage.getPointerPosition();

      //   var mousePointTo = {
      //     x: (pointer.x - stage.x()) / oldScale,
      //     y: (pointer.y - stage.y()) / oldScale,
      //   };

      //   var newScale =
      //     e.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy;

      //   stage.scale({ x: newScale, y: newScale });

      //   var newPos = {
      //     x: pointer.x - mousePointTo.x * newScale,
      //     y: pointer.y - mousePointTo.y * newScale,
      //   };
      //   stage.position(newPos);
      //   stage.batchDraw();
      // });
  
    }, [])

    const exportStage = useCallback(
      async () => {
        
        let sceneStage = stage.findOne("#background")
        let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")

        const svgContainer = SVG()

        svg.setAttribute("width", sceneStage.width() * sceneStage.scaleX())
        svg.setAttribute("height", sceneStage.height() * sceneStage.scaleY())


        let svgNS = svg.namespaceURI
        let camel = (s) => s.replace(/[A-Z]/g, '-$&').toLowerCase()
        
        async function createElement(object) {
            const { attrs, className: type } = object



            let shape = null
            // if(type === "Text") {
            //   shape = document.createElementNS(svgNS, "foreignObject")
            // } else 
            if(type === "Image") {
              shape = document.createElementNS(svgNS, "foreignObject")
            } else if(type === "Line") {
              shape = document.createElementNS(svgNS, "polyline")

            } else {
              shape = document.createElementNS(svgNS, type.toLowerCase())
            }


            
            
            for(let attr in attrs) {
              if(attr === "image" || attr === "dragBoundFunc") {

              } else if(attr === "points") {
                shape.setAttribute(camel(attr), attrs[attr].join(","))  
              } else {
                shape.setAttribute(camel(attr), attrs[attr])  
              }
            }


          
            
            shape.setAttribute("width", (object.width() * object.scaleX()))
            shape.setAttribute("height", (object.height() * object.scaleY()))  


            if(type.toLowerCase() === "image") {

              const img = document.createElement("img")

              img.setAttribute("src", await getDataUrl(object.attrs.image))

              for(let attr in attrs) {
                if(attr === "image" || attr === "dragBoundFunc") {

                } else {
                  img.setAttribute(camel(attr), attrs[attr])  
                }
              }

              img.setAttribute("width", (object.width() * object.scaleX())   )
              img.setAttribute("height", (object.height() * object.scaleY())  )
              shape.appendChild(img)
            }
            
            if(type.toLowerCase() === "text") {

              // const text = document.createElementNS(svgNS, type.toLowerCase())

              // for(let attr in attrs) {
              //   if(attr === "width" || attr === "height" || attr === "x" || attr === "y" || attr === "dragBoundFunc") {

              //   } else {
              //     text.setAttribute(camel(attr), attrs[attr])  
              //   }
              // }

            
              
              // shape.setAttribute("y", object.y() + 2)  
              shape.setAttribute("dominant-baseline", "hanging")  
              shape.setAttribute("font-family", object.fontFamily())  


              // shape.setAttribute("y", object.y() + 2)  
              // shape.setAttribute("dominant-baseline", "hanging")  
              // shape.setAttribute("font-family", object.fontFamily())  


              const specialText = object.getAttr("specialText")

              // if(specialText) {
              //   text.textContent = specialText
              // } else {
              //   text.textContent = object.text()
              // }

              // shape.appendChild(text)
              if(specialText) {
                shape.textContent = specialText
              } else {
                shape.textContent = object.text()
              }
            }

            if(type === "Line") {
              shape.setAttribute("stroke", "black")  
              shape.setAttribute("fill", "none")  
            }

           

            shape.setAttribute("x", (object.x() * object.scaleX()) - offset / 2 )
            shape.setAttribute("y", ((object.y() * object.scaleY()) - offset / 2 ) + (type === "Text" ? 3 : 0))  
            // preserveAspectRatio="xMinYMin meet"

            if(type.toLowerCase() === "text") {

              const container = document.createElementNS(svgNS, "foreignObject")
              const group = document.createElementNS(svgNS, "g")
              const svgChild = document.createElementNS(svgNS, "svg")
              const text = document.createElement("div")


              group.appendChild(svgChild)
              svgChild.appendChild(shape)

              container.setAttribute("x", ((object.x() * object.scaleX()) - offset / 2 ) - 0.5)
              container.setAttribute("y", ((object.y() * object.scaleY()) - offset / 2) - 1)  
              container.setAttribute("width", (object.width() * object.scaleX())   )
              container.setAttribute("height", (object.height() * object.scaleY())  )


              text.style["height"] = object.height() + "px"
              text.style["width"] = object.width() + "px"
              text.style["word-break"] = "break-word"


              text.style.fontSize = object.fontSize() + 'px'
              text.style.border = 'none'
              text.style.padding = '0px'
              text.style.margin = '0px'
              text.style.float = "left"
              text.style.overflow = 'hidden'
              text.style.background = 'none'
              text.style.outline = 'none'
              text.style.resize = 'none'
              text.style.lineHeight = object.lineHeight()
              text.style.fontFamily = object.fontFamily()
      
              text.style.transformOrigin = 'left top'
              text.style.textAlign = object.align()
              text.style.color = object.fill()

            

              container.appendChild(text)

              const specialText = object.getAttr("specialText")

      
            if(specialText) {
              text.textContent = specialText
            } else {
              text.textContent = object.text()
            }


             svg.appendChild(container)
            } else {
              svg.appendChild(shape)
            }
          }
          
          console.log(stage.toJSON())
          

          for(let shape of stage.find(".object")) {
            if(shape.className !== "Transformer") {
              await createElement(shape)
            }
          }

        let xmlSerializer = new XMLSerializer()
        let svgStr = xmlSerializer.serializeToString(svg)


        document.body.appendChild(svg)

        try {
          navigator.clipboard.writeText(svgStr).then(function() {
            console.log("Copied!")
          })
        } catch(err) {
          console.log(err)
        }

        // textboxRef.current.value = svgStr

        setSvgText(svgStr)
      },
      [stage],
    )
    const moveUp = useCallback(() => {
      if(selected) {
        const node = stage.findOne("#"+selected)
        const trans = stage.findOne("#"+node.id()+"_transformer")
        
        node.moveUp()
        trans && trans.moveUp()
        node.parent.draw()

      }
    },[selected, stage])

    const moveDown = useCallback(() => {
      if(selected) {
        const node = stage.findOne("#"+selected)
        const trans = stage.findOne("#"+node.id()+"_transformer")
        node.moveDown()


        trans && trans.moveDown()
        node.parent.draw()
      }
    },[selected, stage])


    const deleteObject = useCallback(() => {
      if(selected) {
        const node = stage.findOne("#"+selected)
        const trans = stage.findOne("#"+node.id()+"_transformer")
        const layer = node.parent

        trans && trans.detach()
        node.destroy()
        layer.draw()

        if(store.mode === "SIGNATURE") {
          setModeHand()
        }

      }
    },[selected, stage, store.mode])


  
      
    const setModeHand = useCallback(() => {
      setMode("HAND")
    },[])

    const setModeSignature = useCallback(() => {
      setMode("SIGNATURE")
    },[])

    const setModeText = useCallback(() => {
      setMode("TEXT")
    },[])

  
    const setModeRect = useCallback(() => {
      setMode("RECT")
    },[])


    const setModeImage = useCallback(() => {
      setMode("IMAGE")
    },[])



   


    return (
      <>
      <StageContainer>
        <NavContainer>
            <NavButton onClick={exportStage}><Icon type="fas fa-download" size="20px"/></NavButton>
            <div style={{margin: "0 50px"}}></div>
            <NavButton onClick={setModeHand} isSelected={store.mode === "HAND"}>
              <CursorIcon fill={store.mode === "HAND" ? "#579aff" : "#828282"}/>
              {/* <Icon type="fas fa-hand-paper" size="20px"/> */}
            </NavButton>
            {/* <NavButton onClick={setModeSignature} isSelected={store.mode === "SIGNATURE"}><Icon type="fas fa-signature" size="20px"/></NavButton> */}
            <NavButton  style={{width: 40, height: 40}} onClick={setModeText} isSelected={store.mode === "TEXT"}> <h3>T</h3>  </NavButton>
            <NavButton onClick={setModeRect} isSelected={store.mode === "RECT"}><Icon type="fas fa-vector-square" size="20px"/></NavButton>
            <div style={{margin: "0 50px"}}></div>
            <NavButton onClick={setModeImage} isSelected={store.mode === "IMAGE"}><Icon type="fas fa-images" size="20px"/></NavButton>
            <div style={{margin: "0 50px"}}></div>
            <div style={{margin: "0 20px"}}></div>
            
        </NavContainer>



        <LeftSide></LeftSide>

        <CanvasWrapper ref={canvasCB} id="canvas">
          {stage && props.children && Array.isArray(props.children) && props.children.map(struct => {
            return <Structure {...struct} stage={stage} />
          })}
        </CanvasWrapper>

        <div style={{margin: "auto"}}>
          {/* <textarea type="text" style={{ width: "300px", height: "200px", border: "1px solid rgba(0,0,0,0.3)", outline: "none", resize: "none", borderRadius: 3}} width="200px"  ref={textboxRef}/> */}

          <CodeMirrorInput text={svgText} />  
        </div>

        <RightSide id="rightside">
          <SideMenu>
            <SideMenuHeader>
              <h2>
                {DisplayText(selectedObject, stage)}
              </h2>
            </SideMenuHeader>
            <SideMenuParameters>
               {selectedObject && <ShapeSizeAttributes hideHeight={selectedObject.className === "Text"} selectedObject={selectedObject} stage={stage}/>}
               {selectedObject && selectedObject.className === "Text" && <TextFormAttributes selectedObject={selectedObject} key={selectedObject.id()} stage={stage}/>}
               {selectedObject && selectedObject.className === "Rect" && <RectFormAttributes selectedObject={selectedObject} stage={stage}/>}
               {selectedObject && (
                <AttributeSection style={{display: "flex", justifyContent: "center", marginTop: 50, flexFlow: "row"}}>
                        <NavButton onClick={moveUp} style={{padding: 7, width: 50}}><Icon type="fas fa-angle-up" size="20px"/></NavButton>
                        <NavButton onClick={moveDown} style={{padding: 7, width: 50}}><Icon type="fas fa-angle-down" size="20px"/></NavButton>
                </AttributeSection>
               )}

               
               {selectedObject && (
                <AttributeSection style={{display: "flex", justifyContent: "center", marginTop: 30}}>

                  <NavButton style={{margin: 5, width: 150}} onClick={deleteObject}><Icon type="fas fa-trash" style={{color: "#ff8484"}} size="20px"/></NavButton>
                </AttributeSection>
               )}
            </SideMenuParameters>
            
          </SideMenu>
        </RightSide>
      </StageContainer>
        </>
    )
  }


  export default Stage



